import { ExecutionProvider, ExecutionRequest, ExecutionResult } from '../types/execution.js';
import { DockerExecutor, dockerExecutor } from './docker/DockerExecutor.js';
import { SandboxExecutor, sandboxExecutor } from './sandbox/SandboxExecutor.js';
import { OnlineJudgeExecutor } from './OnlineJudgeExecutor.js';
import { logger } from '../utils/logger.js';
import { judgeConfig } from '../config/judge.config.js';

const log = logger.createScope('JudgeService');

export class JudgeService {
    private dockerProvider: DockerExecutor;
    private sandboxProvider: SandboxExecutor;
    private onlineJudgeProvider: ExecutionProvider;
    private explicitProvider?: ExecutionProvider;
    private isInitialized = false;

    constructor(
        provider?: ExecutionProvider,
        dockerExec: DockerExecutor = dockerExecutor,
        sandboxExec: SandboxExecutor = sandboxExecutor
    ) {
        this.dockerProvider = dockerExec;
        this.sandboxProvider = sandboxExec;
        this.onlineJudgeProvider = new OnlineJudgeExecutor();
        this.explicitProvider = provider;
    }

    async init(): Promise<void> {
        if (this.isInitialized) return;
        this.isInitialized = true;

        if (judgeConfig.executionProvider === 'docker' || judgeConfig.executionProvider === 'auto') {
            log.info('Checking Docker execution environment availability...');
            await this.dockerProvider.init();
        }
    }

    setProvider(provider: ExecutionProvider): void {
        this.explicitProvider = provider;
    }

    getProviderName(): string {
        return this.explicitProvider?.name || judgeConfig.executionProvider || 'auto';
    }

    getHealthStats() {
        const isDocker = this.dockerProvider.getWorkerManager().getDockerAvailable();
        const sandboxStats = this.sandboxProvider.getWorkerManager().getStats();
        const sandboxQueue = this.sandboxProvider.getQueueStats();
        const dockerStats = isDocker ? this.dockerProvider.getWorkerManager().getStats() : null;

        return {
            status: 'ok',
            primaryExecutionEngine: isDocker ? 'docker_worker_pool' : 'internal_sandbox_pool',
            dockerAvailable: isDocker,
            workers: {
                total: isDocker && dockerStats ? dockerStats.total : sandboxStats.total,
                available: isDocker && dockerStats ? dockerStats.available : sandboxStats.available,
                busy: isDocker && dockerStats ? dockerStats.busy : sandboxStats.busy,
            },
            queue: {
                size: sandboxQueue.size,
                maxSize: sandboxQueue.maxSize,
            },
            onlineFallbackAvailable: true,
        };
    }

    async execute(request: ExecutionRequest): Promise<ExecutionResult> {
        if (!request.language || typeof request.language !== 'string' || request.language.trim() === '') {
            return {
                status: 'failed',
                stdout: '',
                stderr: null,
                exception: null,
                error: 'Language must be a non-empty string',
            };
        }

        if (typeof request.source !== 'string' || request.source.trim() === '') {
            return {
                status: 'failed',
                stdout: '',
                stderr: null,
                exception: null,
                error: 'Source code must be a non-empty string',
            };
        }

        const normalizedRequest: ExecutionRequest = {
            language: request.language.trim(),
            source: request.source,
            stdin: typeof request.stdin === 'string' ? request.stdin : '',
        };

        if (this.explicitProvider) {
            log.info(`Executing with explicit provider: ${this.explicitProvider.name}`);
            return this.explicitProvider.execute(normalizedRequest);
        }

        const mode: string = judgeConfig.executionProvider;

        if (mode === 'online' || mode === 'jdoodle') {
            log.info(`Execution mode "${mode}" selected: routing directly to Online Judge.`);
            return this.onlineJudgeProvider.execute(normalizedRequest);
        }

        if (mode === 'docker') {
            log.info('Execution mode "docker" selected: routing to Docker Worker Pool.');
            return this.dockerProvider.execute(normalizedRequest);
        }

        if (mode === 'sandbox') {
            log.info('Execution mode "sandbox" selected: routing to Internal Sandbox Pool.');
            return this.sandboxProvider.execute(normalizedRequest);
        }

        // --- 3-TIER EXECUTION PIPELINE (Default 'auto' mode) ---

        // [Tier 1]: Docker Sandbox (if Docker daemon is available and accessible)
        const isDockerReady = this.dockerProvider.getWorkerManager().getDockerAvailable();
        if (isDockerReady) {
            log.info('[Tier 1] Docker sandbox is available. Dispatching to Docker Worker Pool...');
            const dockerResult = await this.dockerProvider.execute(normalizedRequest);

            // If queue full or completed normally without fatal worker crash, return directly
            if (dockerResult.error === 'Judge queue full' || !dockerResult.error?.includes('Worker execution error')) {
                return dockerResult;
            }

            log.warn(`[Tier 1] Docker execution failed with worker error (${dockerResult.error}), falling back to Tier 2 (Internal Sandbox)...`);
        }

        // [Tier 2]: Internal Sandbox (Bubblewrap / POSIX ulimit with Worker Pool)
        log.info(`[Tier 2] Dispatching to Internal Sandbox Worker Pool (${judgeConfig.workers} workers, max queue: ${judgeConfig.maxQueueSize})...`);
        const sandboxResult = await this.sandboxProvider.execute(normalizedRequest);

        if (sandboxResult.error === 'Judge queue full') {
            return sandboxResult;
        }

        // Check if compiler missing on this host environment
        const isCompilerMissing = Boolean(
            sandboxResult.error &&
            (sandboxResult.error.includes('not found') || sandboxResult.error.includes('Unsupported language'))
        );

        if (isCompilerMissing) {
            // [Tier 3]: Online Judge API Fallback (JDoodle)
            log.info(`[Tier 3] Compiler unavailable locally for "${normalizedRequest.language}", falling back to Online Judge (JDoodle)...`);
            return this.onlineJudgeProvider.execute(normalizedRequest);
        }

        return sandboxResult;
    }
}

export const judgeService = new JudgeService();
