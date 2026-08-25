import { spawn } from 'child_process';
import { ExecutionRequest, ExecutionResult } from '../../types/execution.js';
import { judgeConfig } from '../../config/judge.config.js';
import { logger } from '../../utils/logger.js';
import crypto from 'crypto';

export type WorkerState = 'STARTING' | 'IDLE' | 'BUSY' | 'ERROR' | 'STOPPED';

interface ExecProcessResult {
    stdout: string;
    stderr: string;
    exitCode: number | null;
    timedOut: boolean;
    durationMs: number;
}

export class DockerWorker {
    readonly id: number;
    readonly containerName: string;
    private state: WorkerState = 'STOPPED';
    private log = logger.createScope('DockerWorker');

    constructor(id: number) {
        this.id = id;
        this.containerName = `${judgeConfig.containerPrefix}-${id}`;
        this.log = logger.createScope(`Worker-${id}`);
    }

    getState(): WorkerState {
        return this.state;
    }

    isAvailable(): boolean {
        return this.state === 'IDLE';
    }

    private runHostCommand(
        command: string,
        args: string[],
        stdin?: string,
        timeoutMs: number = 15000
    ): Promise<ExecProcessResult> {
        return new Promise((resolve) => {
            const startTime = Date.now();
            let stdout = '';
            let stderr = '';
            let timedOut = false;

            const child = spawn(command, args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                windowsHide: true,
            });

            const timer = setTimeout(() => {
                timedOut = true;
                child.kill('SIGKILL');
            }, timeoutMs);

            child.stdout?.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr?.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('error', (err) => {
                clearTimeout(timer);
                resolve({
                    stdout,
                    stderr: `${stderr}\n${err.message}`.trim(),
                    exitCode: -1,
                    timedOut: false,
                    durationMs: Date.now() - startTime,
                });
            });

            child.on('close', (code) => {
                clearTimeout(timer);
                resolve({
                    stdout,
                    stderr,
                    exitCode: code,
                    timedOut,
                    durationMs: Date.now() - startTime,
                });
            });

            if (stdin !== undefined && child.stdin) {
                child.stdin.write(stdin);
                child.stdin.end();
            } else if (child.stdin) {
                child.stdin.end();
            }
        });
    }

    async init(): Promise<boolean> {
        this.state = 'STARTING';
        this.log.info(`Initializing warm container "${this.containerName}" (image: ${judgeConfig.dockerImage})...`);

        // 1. Remove old container if it exists
        await this.runHostCommand('docker', ['rm', '-f', this.containerName], undefined, 10000);

        // 2. Start new warm worker container
        const memoryArg = `--memory=${judgeConfig.workerMemoryMb}m`;
        const cpusArg = `--cpus=${judgeConfig.workerCpus}`;
        const pidsArg = `--pids-limit=${judgeConfig.workerPidsLimit}`;

        const runArgs = [
            'run',
            '-d',
            '--name', this.containerName,
            '--network', 'none',
            memoryArg,
            cpusArg,
            pidsArg,
            judgeConfig.dockerImage,
            'tail', '-f', '/dev/null',
        ];

        const startRes = await this.runHostCommand('docker', runArgs, undefined, 20000);

        if (startRes.exitCode !== 0) {
            this.log.error(`Failed to start container "${this.containerName}": ${startRes.stderr || 'Unknown error'}`);
            this.state = 'ERROR';
            return false;
        }

        // 3. Ensure /tmp/sandbox exists with open permissions
        await this.runHostCommand('docker', [
            'exec',
            '-u', '0',
            this.containerName,
            'sh', '-c', 'mkdir -p /tmp/sandbox && chmod 777 /tmp/sandbox',
        ]);

        this.state = 'IDLE';
        this.log.info(`Worker "${this.containerName}" is ready (State: IDLE, Memory: ${judgeConfig.workerMemoryMb}MB).`);
        return true;
    }

    async isAlive(): Promise<boolean> {
        const checkRes = await this.runHostCommand('docker', [
            'inspect',
            '-f', '{{.State.Running}}',
            this.containerName,
        ], undefined, 5000);

        return checkRes.exitCode === 0 && checkRes.stdout.trim() === 'true';
    }

    async destroy(): Promise<void> {
        this.state = 'STOPPED';
        this.log.info(`Destroying container "${this.containerName}"...`);
        await this.runHostCommand('docker', ['rm', '-f', this.containerName], undefined, 10000);
    }

    async execute(request: ExecutionRequest): Promise<ExecutionResult> {
        this.state = 'BUSY';
        const runId = `run_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const runDir = `/tmp/sandbox/${runId}`;
        const lang = (request.language || '').toLowerCase().trim();
        const timeoutMs = judgeConfig.executionTimeoutMs;

        this.log.info(`Executing job (${runId}): language="${lang}", timeout=${timeoutMs}ms`);

        try {
            // 1. Create run directory in container
            const mkdirRes = await this.runHostCommand('docker', [
                'exec',
                '-u', 'judge_sandbox',
                this.containerName,
                'mkdir', '-p', runDir,
            ], undefined, 5000);

            if (mkdirRes.exitCode !== 0) {
                throw new Error(`Failed to create execution sandbox: ${mkdirRes.stderr}`);
            }

            // 2. Transfer source code & stdin into container
            const fileName = this.getSourceFileName(lang);
            const srcPath = `${runDir}/${fileName}`;
            const stdinPath = `${runDir}/stdin.txt`;

            await this.runHostCommand('docker', [
                'exec',
                '-i',
                '-u', 'judge_sandbox',
                this.containerName,
                'sh', '-c', `cat > "${srcPath}"`,
            ], request.source, 10000);

            await this.runHostCommand('docker', [
                'exec',
                '-i',
                '-u', 'judge_sandbox',
                this.containerName,
                'sh', '-c', `cat > "${stdinPath}"`,
            ], request.stdin ?? '', 10000);

            // 3. Compile if necessary
            let compilationTime = 0;
            const compileCmd = this.getCompileCommand(lang, runDir, fileName);

            if (compileCmd) {
                const compStart = Date.now();
                const compRes = await this.runHostCommand('docker', [
                    'exec',
                    '-u', 'judge_sandbox',
                    '-w', runDir,
                    this.containerName,
                    'sh', '-c', compileCmd,
                ], undefined, 15000);

                compilationTime = Date.now() - compStart;

                if (compRes.exitCode !== 0) {
                    this.log.warn(`Compilation error for job ${runId}: ${compRes.stderr.slice(0, 200)}`);
                    return {
                        status: 'failed',
                        stdout: '',
                        stderr: compRes.stderr || 'Compilation failed',
                        exception: null,
                        error: null,
                        compilationTime,
                    };
                }
            }

            // 4. Run binary / script under judge_sandbox user
            const runCmd = this.getRunCommand(lang, runDir, fileName);
            if (!runCmd) {
                return {
                    status: 'failed',
                    stdout: '',
                    stderr: null,
                    exception: null,
                    error: `Unsupported language for Docker sandbox: "${lang}"`,
                };
            }

            const execRes = await this.runHostCommand('docker', [
                'exec',
                '-i',
                '-u', 'judge_sandbox',
                '-w', runDir,
                this.containerName,
                'sh', '-c', `${runCmd} < "${stdinPath}"`,
            ], undefined, timeoutMs + 2000);

            const isTLE = execRes.timedOut;
            const isNonZero = execRes.exitCode !== 0 && !isTLE;

            return {
                status: isTLE || isNonZero ? 'failed' : 'success',
                stdout: execRes.stdout,
                stderr: isTLE ? 'Time Limit Exceeded' : execRes.stderr || null,
                exception: isNonZero ? execRes.stderr || 'Runtime Error' : null,
                error: isTLE ? 'Time Limit Exceeded' : null,
                compilationTime,
                executionTime: execRes.durationMs,
            };

        } catch (err: any) {
            this.log.error(`Execution failure in worker ${this.containerName}: ${err.message}`);
            // Check if container is still alive
            const alive = await this.isAlive();
            if (!alive) {
                this.state = 'ERROR';
            }
            return {
                status: 'failed',
                stdout: '',
                stderr: null,
                exception: null,
                error: `Worker execution error: ${err.message}`,
            };
        } finally {
            // Clean up run directory inside container
            try {
                await this.runHostCommand('docker', [
                    'exec',
                    '-u', 'judge_sandbox',
                    this.containerName,
                    'rm', '-rf', runDir,
                ], undefined, 5000);
            } catch {
                // Ignore cleanup error
            }

            const currentState = this.state as WorkerState;
            if (currentState !== 'ERROR' && currentState !== 'STOPPED') {
                this.state = 'IDLE';
            }
        }
    }

    private getSourceFileName(lang: string): string {
        switch (lang) {
            case 'cpp':
            case 'c++':
            case 'cc':
            case 'cxx':
                return 'main.cpp';
            case 'c':
                return 'main.c';
            case 'python':
            case 'python3':
            case 'py':
                return 'main.py';
            case 'java':
                return 'Main.java';
            case 'javascript':
            case 'js':
            case 'nodejs':
                return 'main.js';
            case 'typescript':
            case 'ts':
                return 'main.ts';
            default:
                return 'source.txt';
        }
    }

    private getCompileCommand(lang: string, _dir: string, _fileName: string): string | null {
        switch (lang) {
            case 'cpp':
            case 'c++':
            case 'cc':
            case 'cxx':
                return 'g++ -O2 -std=c++17 main.cpp -o main.out';
            case 'c':
                return 'gcc -O2 -std=c11 main.c -o main.out';
            case 'java':
                return 'javac Main.java';
            default:
                return null;
        }
    }

    private getRunCommand(lang: string, _dir: string, _fileName: string): string | null {
        switch (lang) {
            case 'cpp':
            case 'c++':
            case 'cc':
            case 'cxx':
            case 'c':
                return './main.out';
            case 'python':
            case 'python3':
            case 'py':
                return 'python3 main.py';
            case 'java':
                return 'java Main';
            case 'javascript':
            case 'js':
            case 'nodejs':
                return 'node main.js';
            case 'typescript':
            case 'ts':
                return 'npx tsx main.ts';
            default:
                return null;
        }
    }
}
