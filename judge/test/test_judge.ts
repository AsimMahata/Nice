import { app } from '../src/server.js';
import { JudgeService } from '../src/services/JudgeService.js';
import { OnlineJudgeExecutor } from '../src/services/OnlineJudgeExecutor.js';
import { JDoodleExecutor } from '../src/services/JDoodleExecutor.js';
import { WorkerManager } from '../src/services/docker/WorkerManager.js';
import { ExecutionQueue } from '../src/services/queue/ExecutionQueue.js';
import { ExecutionProvider, ExecutionRequest, ExecutionResult } from '../src/types/execution.js';
import { JudgeClient } from '../../backend/src/services/judge/JudgeClient.js';
import { judgeConfig } from '../src/config/judge.config.js';
import http from 'http';

class MockExecutionProvider implements ExecutionProvider {
    readonly name = 'MockProvider';

    async execute(req: ExecutionRequest): Promise<ExecutionResult> {
        if (req.source.includes('SYNTAX_ERROR')) {
            return {
                status: 'failed',
                stdout: '',
                stderr: "main.cpp:2:1: error: expected ';' before 'return'",
                exception: null,
                error: null,
                compilationTime: 45,
            };
        }

        if (req.source.includes('RUNTIME_ERROR')) {
            return {
                status: 'failed',
                stdout: 'Starting...\n',
                stderr: 'ZeroDivisionError: division by zero',
                exception: 'ZeroDivisionError: division by zero',
                error: null,
                executionTime: 20,
            };
        }

        if (req.source.includes('API_FAIL')) {
            return {
                status: 'failed',
                stdout: '',
                stderr: null,
                exception: null,
                error: 'Online Judge API error (401): Unauthorized',
            };
        }

        return {
            status: 'success',
            stdout: `Hello from ${req.language}! Input was: ${req.stdin ?? ''}`,
            stderr: null,
            exception: null,
            error: null,
            compilationTime: 30,
            executionTime: 15,
            memoryUsed: 10240,
        };
    }
}

async function runTests() {
    console.log('--- STARTING JUDGE SERVICE TESTS ---\n');
    let passed = 0;
    let failed = 0;

    function assert(condition: boolean, testName: string, detail?: any) {
        if (condition) {
            console.log(`[PASS] ${testName}`);
            passed++;
        } else {
            console.error(`[FAIL] ${testName}`, detail ?? '');
            failed++;
        }
    }

    // 1. Test Config & WorkerManager
    assert(judgeConfig.workers === 2, 'Default JUDGE_WORKERS is 2');
    assert(judgeConfig.workerMemoryMb === 100, 'Default JUDGE_WORKER_MEMORY_MB is 100');
    assert(judgeConfig.maxQueueSize === 20, 'Default JUDGE_MAX_QUEUE_SIZE is 20');

    const workerMgr = new WorkerManager();
    const stats = workerMgr.getStats();
    assert(stats.total === 2, 'WorkerManager maintains 2 workers by default');

    // 2. Test ExecutionQueue Capacity & Rejection
    const mockWorkerMgr = new WorkerManager();
    const queue = new ExecutionQueue(mockWorkerMgr);
    assert(queue.size === 0, 'Initial ExecutionQueue size is 0');
    assert(queue.maxSize === 20, 'ExecutionQueue maxSize matches config');

    // Fill queue to test limit
    const promises: Promise<ExecutionResult>[] = [];
    for (let i = 0; i < judgeConfig.maxQueueSize; i++) {
        promises.push(queue.enqueue({ language: 'cpp', source: 'int main(){}', stdin: '' }));
    }
    assert(queue.size === judgeConfig.maxQueueSize, 'Queue successfully holds maxQueueSize jobs');

    // 21st job should be rejected with "Judge queue full"
    const overflowRes = await queue.enqueue({ language: 'cpp', source: 'int main(){}', stdin: '' });
    assert(
        Boolean(overflowRes.status === 'failed' && overflowRes.error === 'Judge queue full'),
        'ExecutionQueue rejects with "Judge queue full" when capacity exceeded'
    );

    // 3. Test Online Judge Providers
    const ojExecutor = new OnlineJudgeExecutor();
    assert(ojExecutor.name === 'OnlineJudge', 'OnlineJudgeExecutor name is "OnlineJudge"');

    const jdoodle = new JDoodleExecutor();
    assert(jdoodle.name === 'JDoodle', 'JDoodleExecutor name is "JDoodle"');

    const origId = process.env.JDOODLE_CLIENT_ID;
    const origSecret = process.env.JDOODLE_CLIENT_SECRET;
    delete process.env.JDOODLE_CLIENT_ID;
    delete process.env.JDOODLE_CLIENT_SECRET;
    delete process.env.ONLINE_JUDGE_CLIENT_ID;
    delete process.env.ONLINE_JUDGE_CLIENT_SECRET;

    const jdoodleNoKeyRes = await jdoodle.execute({ language: 'cpp', source: 'int main(){}' });
    assert(
        Boolean(
            jdoodleNoKeyRes.status === 'failed' &&
            jdoodleNoKeyRes.error?.includes('JDoodle credentials')
        ),
        'JDoodleExecutor returns normalized error when credentials are not configured'
    );

    if (origId) process.env.JDOODLE_CLIENT_ID = origId;
    if (origSecret) process.env.JDOODLE_CLIENT_SECRET = origSecret;

    // 4. Test JudgeService with MockProvider
    const mockProvider = new MockExecutionProvider();
    const judge = new JudgeService(mockProvider);

    // Test Validation: missing language
    const missingLangRes = await judge.execute({ language: '', source: 'int main(){}' });
    assert(Boolean(missingLangRes.status === 'failed' && missingLangRes.error?.includes('Language')), 'Validation: missing language rejected');

    // Test Validation: missing source
    const missingSourceRes = await judge.execute({ language: 'cpp', source: '' });
    assert(Boolean(missingSourceRes.status === 'failed' && missingSourceRes.error?.includes('Source code')), 'Validation: missing source rejected');

    // Test Execution: Success with stdin
    const successRes = await judge.execute({ language: 'cpp', source: 'int main(){}', stdin: '42' });
    assert(
        Boolean(
            successRes.status === 'success' &&
            successRes.stdout.includes('42') &&
            successRes.compilationTime === 30 &&
            successRes.executionTime === 15
        ),
        'JudgeService execution: success with stdin'
    );

    // Test Execution: Compilation Error
    const compErrRes = await judge.execute({ language: 'cpp', source: 'SYNTAX_ERROR' });
    assert(
        Boolean(
            compErrRes.status === 'failed' &&
            compErrRes.stderr?.includes('main.cpp:2:1: error')
        ),
        'JudgeService execution: compilation error handled'
    );

    // Test Execution: Runtime Error
    const runtimeErrRes = await judge.execute({ language: 'python', source: 'RUNTIME_ERROR' });
    assert(
        Boolean(
            runtimeErrRes.status === 'failed' &&
            runtimeErrRes.exception?.includes('ZeroDivisionError')
        ),
        'JudgeService execution: runtime error handled'
    );

    // Test Execution: API Failure
    const apiFailRes = await judge.execute({ language: 'cpp', source: 'API_FAIL' });
    assert(
        Boolean(
            apiFailRes.status === 'failed' &&
            apiFailRes.error?.includes('401')
        ),
        'JudgeService execution: API failure handled'
    );

    // 5. Test HTTP Endpoints on real Express Server
    const TEST_PORT = 5002;
    process.env.PORT = String(TEST_PORT);
    const server = http.createServer(app);

    await new Promise<void>((resolve) => server.listen(TEST_PORT, () => resolve()));
    console.log(`\nTest server listening on port ${TEST_PORT}\n`);

    try {
        // Test GET /health returns workers and queue metrics
        const healthRes = await fetch(`http://localhost:${TEST_PORT}/health`);
        const healthJson = (await healthRes.json()) as any;
        assert(
            Boolean(
                healthRes.status === 200 &&
                healthJson.status === 'ok' &&
                healthJson.workers?.total !== undefined &&
                healthJson.queue?.maxSize === 20
            ),
            'HTTP GET /health returns { status: "ok", workers, queue }'
        );

        // Test GET /
        const rootRes = await fetch(`http://localhost:${TEST_PORT}/`);
        const rootJson = (await rootRes.json()) as any;
        assert(Boolean(rootRes.status === 200 && rootJson.service === 'judge'), 'HTTP GET / returns service info');

        // Test POST /execute validation (400)
        const badPostRes = await fetch(`http://localhost:${TEST_PORT}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: 'cpp' }), // missing source
        });
        const badPostJson = (await badPostRes.json()) as any;
        assert(Boolean(badPostRes.status === 400 && badPostJson.status === 'failed'), 'HTTP POST /execute returns 400 on missing fields');

        // Test POST /execute with JavaScript via HTTP
        const postJsRes = await fetch(`http://localhost:${TEST_PORT}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: 'javascript', source: 'console.log("judge server test");' }),
        });
        const postJsJson = (await postJsRes.json()) as any;
        assert(
            Boolean(
                postJsRes.status === 200 &&
                postJsJson.status === 'success' &&
                postJsJson.stdout.includes('judge server test')
            ),
            'HTTP POST /execute successfully executes code through Judge Service'
        );

        // 6. Test Backend JudgeClient integration with the Test Judge Server
        process.env.JUDGE_SERVICE_URL = `http://localhost:${TEST_PORT}`;
        const client = new JudgeClient();
        const isHealthy = await client.healthCheck();
        assert(isHealthy === true, 'Backend JudgeClient.healthCheck() returns true when Judge is up');

        // 7. Test Backend JudgeClient resilience when Judge is down
        process.env.JUDGE_SERVICE_URL = 'http://localhost:59999'; // unreachable
        const deadClient = new JudgeClient();
        const isDeadHealthy = await deadClient.healthCheck();
        assert(isDeadHealthy === false, 'Backend JudgeClient.healthCheck() returns false when Judge is down');

        let threwUnavailable = false;
        try {
            await deadClient.execute({ language: 'cpp', source: 'int main(){}', stdin: '' }, 1000);
        } catch (err: any) {
            threwUnavailable = err.message.includes('Judge service unavailable');
        }
        assert(threwUnavailable, 'Backend JudgeClient.execute() throws controlled "Judge service unavailable" error');

    } finally {
        await new Promise<void>((resolve) => server.close(() => resolve()));
    }

    console.log(`\n===============================`);
    console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
    console.log(`===============================\n`);

    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
