import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { ExecutionRequest, ExecutionResult } from '../../types/execution.js';
import { judgeConfig } from '../../config/judge.config.js';
import { logger } from '../../utils/logger.js';

export type WorkerState = 'IDLE' | 'BUSY' | 'ERROR';

interface ProcessExecResult {
    stdout: string;
    stderr: string;
    exitCode: number | null;
    timedOut: boolean;
    durationMs: number;
}

export class SandboxWorker {
    readonly id: number;
    private state: WorkerState = 'IDLE';
    private log = logger.createScope('SandboxWorker');
    private static hasBwrapChecked = false;
    private static isBwrapAvailable = false;

    constructor(id: number) {
        this.id = id;
        this.log = logger.createScope(`Worker-${id}`);
    }

    getState(): WorkerState {
        return this.state;
    }

    isAvailable(): boolean {
        return this.state === 'IDLE';
    }

    private static checkBwrap(): Promise<boolean> {
        if (SandboxWorker.hasBwrapChecked) {
            return Promise.resolve(SandboxWorker.isBwrapAvailable);
        }

        return new Promise((resolve) => {
            // Test if bwrap can actually create a user namespace in this environment
            const child = spawn('bwrap', ['--ro-bind', '/', '/', 'true'], { stdio: 'ignore', windowsHide: true });
            
            const timer = setTimeout(() => {
                try { child.kill('SIGKILL'); } catch {}
                SandboxWorker.hasBwrapChecked = true;
                SandboxWorker.isBwrapAvailable = false;
                resolve(false);
            }, 2000);

            child.on('error', () => {
                clearTimeout(timer);
                SandboxWorker.hasBwrapChecked = true;
                SandboxWorker.isBwrapAvailable = false;
                resolve(false);
            });

            child.on('close', (code) => {
                clearTimeout(timer);
                SandboxWorker.hasBwrapChecked = true;
                SandboxWorker.isBwrapAvailable = code === 0;
                resolve(code === 0);
            });
        });
    }

    private runProcess(
        command: string,
        args: string[],
        cwd: string,
        stdin?: string,
        timeoutMs: number = judgeConfig.executionTimeoutMs
    ): Promise<ProcessExecResult> {
        return new Promise((resolve) => {
            const startTime = Date.now();
            let stdout = '';
            let stderr = '';
            let timedOut = false;

            // Security: strictly isolated sanitized environment (zero host secrets exposed)
            const cleanEnv: NodeJS.ProcessEnv = {
                PATH: process.env.PATH || '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
                JAVA_HOME: process.env.JAVA_HOME || '',
                NODE_ENV: 'production',
                TMPDIR: cwd,
                TEMP: cwd,
                TMP: cwd,
            };

            const child = spawn(command, args, {
                cwd,
                env: cleanEnv,
                stdio: ['pipe', 'pipe', 'pipe'],
                windowsHide: true,
            });

            const timer = setTimeout(() => {
                timedOut = true;
                try {
                    child.kill('SIGKILL');
                } catch {
                    // Ignore kill error
                }
            }, timeoutMs);

            child.stdout?.on('data', (data) => {
                if (stdout.length < 500000) { // Limit stdout memory growth to 500KB
                    stdout += data.toString();
                }
            });

            child.stderr?.on('data', (data) => {
                if (stderr.length < 500000) {
                    stderr += data.toString();
                }
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

    async execute(request: ExecutionRequest): Promise<ExecutionResult> {
        this.state = 'BUSY';
        const lang = (request.language || '').toLowerCase().trim();
        const baseTmp = fs.existsSync('/tmp/sandbox') ? '/tmp/sandbox' : os.tmpdir();
        const runDir = fs.mkdtempSync(path.join(baseTmp, 'run-'));
        const timeoutMs = judgeConfig.executionTimeoutMs;
        const memoryKb = judgeConfig.workerMemoryMb * 1024;
        const isWindows = process.platform === 'win32';
        const bwrapAvailable = !isWindows && (await SandboxWorker.checkBwrap());

        this.log.info(`Executing job (lang="${lang}", memory=${judgeConfig.workerMemoryMb}MB, timeout=${timeoutMs}ms, sandbox=${bwrapAvailable ? 'bubblewrap' : 'rlimit'})...`);

        try {
            switch (lang) {
                case 'cpp':
                case 'c++':
                case 'cc':
                case 'cxx': {
                    const srcPath = path.join(runDir, 'main.cpp');
                    const binName = isWindows ? 'main.exe' : 'main.out';
                    const binPath = path.join(runDir, binName);
                    fs.writeFileSync(srcPath, request.source, 'utf8');

                    // 1. Compile with g++
                    const compStart = Date.now();
                    const compRes = await this.runProcess('g++', ['-O2', '-std=c++17', 'main.cpp', '-o', binName], runDir, undefined, 15000);
                    const compilationTime = Date.now() - compStart;

                    if (compRes.exitCode !== 0 || !fs.existsSync(binPath)) {
                        this.log.warn(`g++ compilation failed (exitCode=${compRes.exitCode}, time=${compilationTime}ms)`);
                        return {
                            status: 'failed',
                            stdout: '',
                            stderr: compRes.stderr || 'Compilation failed',
                            exception: null,
                            error: compRes.stderr.includes('not recognized') || compRes.stderr.includes('ENOENT') ? 'Compiler g++ not found' : null,
                            compilationTime,
                        };
                    }

                    // 2. Run binary with isolation
                    const runRes = await this.executeBinary(binPath, runDir, request.stdin, timeoutMs, memoryKb, bwrapAvailable, isWindows);
                    return this.formatResult(runRes, compilationTime);
                }

                case 'c': {
                    const srcPath = path.join(runDir, 'main.c');
                    const binName = isWindows ? 'main.exe' : 'main.out';
                    const binPath = path.join(runDir, binName);
                    fs.writeFileSync(srcPath, request.source, 'utf8');

                    // 1. Compile with gcc
                    const compStart = Date.now();
                    const compRes = await this.runProcess('gcc', ['-O2', '-std=c11', 'main.c', '-o', binName], runDir, undefined, 15000);
                    const compilationTime = Date.now() - compStart;

                    if (compRes.exitCode !== 0 || !fs.existsSync(binPath)) {
                        this.log.warn(`gcc compilation failed (exitCode=${compRes.exitCode}, time=${compilationTime}ms)`);
                        return {
                            status: 'failed',
                            stdout: '',
                            stderr: compRes.stderr || 'Compilation failed',
                            exception: null,
                            error: compRes.stderr.includes('not recognized') || compRes.stderr.includes('ENOENT') ? 'Compiler gcc not found' : null,
                            compilationTime,
                        };
                    }

                    // 2. Run binary with isolation
                    const runRes = await this.executeBinary(binPath, runDir, request.stdin, timeoutMs, memoryKb, bwrapAvailable, isWindows);
                    return this.formatResult(runRes, compilationTime);
                }

                case 'python':
                case 'python3':
                case 'py': {
                    const srcPath = path.join(runDir, 'main.py');
                    fs.writeFileSync(srcPath, request.source, 'utf8');

                    const pyCmd = isWindows ? 'python' : 'python3';
                    const runRes = await this.executeScript(pyCmd, ['main.py'], runDir, request.stdin, timeoutMs, memoryKb, bwrapAvailable, isWindows);
                    return this.formatResult(runRes);
                }

                case 'java': {
                    const srcPath = path.join(runDir, 'Main.java');
                    fs.writeFileSync(srcPath, request.source, 'utf8');

                    // 1. Compile with javac
                    const compStart = Date.now();
                    const compRes = await this.runProcess('javac', ['Main.java'], runDir, undefined, 15000);
                    const compilationTime = Date.now() - compStart;

                    if (compRes.exitCode !== 0) {
                        this.log.warn(`javac compilation failed (exitCode=${compRes.exitCode}, time=${compilationTime}ms)`);
                        return {
                            status: 'failed',
                            stdout: '',
                            stderr: compRes.stderr || 'Compilation failed',
                            exception: null,
                            error: compRes.stderr.includes('not recognized') || compRes.stderr.includes('ENOENT') ? 'Compiler javac not found' : null,
                            compilationTime,
                        };
                    }

                    // 2. Run Java Main
                    const runRes = await this.executeScript('java', ['-Xmx' + judgeConfig.workerMemoryMb + 'm', 'Main'], runDir, request.stdin, timeoutMs, memoryKb, bwrapAvailable, isWindows);
                    return this.formatResult(runRes, compilationTime);
                }

                case 'javascript':
                case 'js':
                case 'nodejs': {
                    const srcPath = path.join(runDir, 'main.js');
                    fs.writeFileSync(srcPath, request.source, 'utf8');

                    const runRes = await this.executeScript('node', ['--max-old-space-size=' + judgeConfig.workerMemoryMb, 'main.js'], runDir, request.stdin, timeoutMs, memoryKb, bwrapAvailable, isWindows);
                    return this.formatResult(runRes);
                }

                default:
                    return {
                        status: 'failed',
                        stdout: '',
                        stderr: null,
                        exception: null,
                        error: `Unsupported language: "${lang}"`,
                    };
            }
        } catch (err: any) {
            this.log.error(`Worker execution error: ${err.message}`);
            return {
                status: 'failed',
                stdout: '',
                stderr: null,
                exception: null,
                error: `Execution error: ${err.message}`,
            };
        } finally {
            try {
                fs.rmSync(runDir, { recursive: true, force: true });
            } catch {
                // Ignore cleanup error
            }
            this.state = 'IDLE';
        }
    }

    private async executeBinary(
        binPath: string,
        runDir: string,
        stdin: string | undefined,
        timeoutMs: number,
        memoryKb: number,
        bwrapAvailable: boolean,
        isWindows: boolean
    ): Promise<ProcessExecResult> {
        if (bwrapAvailable) {
            // Bubblewrap isolation: no network, read-only root, isolated bind mount for runDir
            const bwrapArgs = [
                '--unshare-net',
                '--ro-bind', '/', '/',
                '--bind', runDir, '/sandbox',
                '--chdir', '/sandbox',
                './main.out',
            ];
            const res = await this.runProcess('bwrap', bwrapArgs, runDir, stdin, timeoutMs);
            
            // If bwrap is restricted by container seccomp / permissions, fallback immediately to ulimit
            if (res.stderr.includes('Creating new namespace failed') || res.stderr.includes('Operation not permitted')) {
                this.log.warn('Bubblewrap namespace creation restricted by host. Falling back to POSIX ulimit isolation.');
                SandboxWorker.isBwrapAvailable = false;
                return this.executeBinary(binPath, runDir, stdin, timeoutMs, memoryKb, false, isWindows);
            }
            return res;
        }

        if (!isWindows) {
            // POSIX ulimit limits: virtual memory, max processes, max file size
            const pids = judgeConfig.workerPidsLimit;
            const ulimitCmd = `ulimit -v ${memoryKb} -u ${pids} -f 10240 -t 5 2>/dev/null; exec ./main.out`;
            return this.runProcess('sh', ['-c', ulimitCmd], runDir, stdin, timeoutMs);
        }

        // Windows fallback
        return this.runProcess(binPath, [], runDir, stdin, timeoutMs);
    }

    private async executeScript(
        cmd: string,
        args: string[],
        runDir: string,
        stdin: string | undefined,
        timeoutMs: number,
        memoryKb: number,
        bwrapAvailable: boolean,
        isWindows: boolean
    ): Promise<ProcessExecResult> {
        if (bwrapAvailable) {
            const bwrapArgs = [
                '--unshare-net',
                '--ro-bind', '/', '/',
                '--bind', runDir, '/sandbox',
                '--chdir', '/sandbox',
                cmd,
                ...args,
            ];
            const res = await this.runProcess('bwrap', bwrapArgs, runDir, stdin, timeoutMs);

            if (res.stderr.includes('Creating new namespace failed') || res.stderr.includes('Operation not permitted')) {
                this.log.warn('Bubblewrap namespace creation restricted by host. Falling back to POSIX ulimit isolation.');
                SandboxWorker.isBwrapAvailable = false;
                return this.executeScript(cmd, args, runDir, stdin, timeoutMs, memoryKb, false, isWindows);
            }
            return res;
        }

        if (!isWindows) {
            const pids = judgeConfig.workerPidsLimit;
            const ulimitCmd = `ulimit -v ${memoryKb} -u ${pids} -f 10240 -t 5 2>/dev/null; exec ${cmd} ${args.join(' ')}`;
            return this.runProcess('sh', ['-c', ulimitCmd], runDir, stdin, timeoutMs);
        }

        return this.runProcess(cmd, args, runDir, stdin, timeoutMs);
    }

    private formatResult(runRes: ProcessExecResult, compilationTime?: number): ExecutionResult {
        const isTLE = runRes.timedOut;
        const isNonZero = runRes.exitCode !== 0 && !isTLE;

        return {
            status: isTLE || isNonZero ? 'failed' : 'success',
            stdout: runRes.stdout,
            stderr: isTLE ? 'Time Limit Exceeded' : runRes.stderr || null,
            exception: isNonZero ? runRes.stderr || 'Runtime Error' : null,
            error: isTLE ? 'Time Limit Exceeded' : null,
            compilationTime,
            executionTime: runRes.durationMs,
        };
    }
}
