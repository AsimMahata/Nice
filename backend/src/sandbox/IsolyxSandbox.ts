import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { ISandboxExecutor, SandboxRequest, SandboxResult } from './ISandboxExecutor.js';

export class IsolyxSandbox implements ISandboxExecutor {
    readonly name = 'Isolyx';

    private readonly binaryPath: string | null;

    constructor() {
        this.binaryPath = process.env.ISOLYX_BIN ?? null;
    }

    async isAvailable(): Promise<boolean> {
        if (process.platform !== 'linux') return false;
        if (!this.binaryPath) return false;
        if (!fs.existsSync(this.binaryPath)) return false;

        try {
            fs.accessSync(this.binaryPath, fs.constants.X_OK);
        } catch {
            return false;
        }

        try {
            execSync(`"${this.binaryPath}" --version`, { timeout: 3000, stdio: 'pipe' });
        } catch {
        }

        return true;
    }

    async execute(req: SandboxRequest): Promise<SandboxResult> {
        if (!this.binaryPath) {
            return this.sandboxError('IsolyxSandbox: binary path not configured');
        }

        const start = Date.now();

        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'isolyx-'));
        const srcFile = path.join(tmpDir, this.getSourceFilename(req.language));
        const inputFile = path.join(tmpDir, 'input.txt');
        const jobFile = path.join(tmpDir, 'job.json');

        try {
            fs.writeFileSync(srcFile, req.code, 'utf8');
            fs.writeFileSync(inputFile, req.input, 'utf8');

            const job = {
                language: req.language,
                source: srcFile,
                input: inputFile,
                time_limit_ms: req.timeLimitMs,
                memory_limit_mb: req.memoryLimitMb,
                pids_limit: 64,
            };
            fs.writeFileSync(jobFile, JSON.stringify(job), 'utf8');

            return await new Promise((resolve) => {
                let stdout = '';
                let stderr = '';

                const child = spawn(this.binaryPath!, ['--job', jobFile], {
                    stdio: 'pipe',
                    env: {},
                });

                const outerTimer = setTimeout(() => {
                    child.kill('SIGKILL');
                }, req.timeLimitMs + 8000);

                child.stdout?.on('data', (d) => (stdout += d.toString()));
                child.stderr?.on('data', (d) => (stderr += d.toString()));

                child.on('error', (err) => {
                    clearTimeout(outerTimer);
                    resolve(this.sandboxError(`Isolyx spawn error: ${err.message}`));
                });

                child.on('close', (code) => {
                    clearTimeout(outerTimer);
                    const elapsed = Date.now() - start;

                    if (code !== 0 && !stdout.trim()) {
                        resolve(this.sandboxError(`Isolyx exited with code ${code}. stderr: ${stderr.slice(0, 500)}`));
                        return;
                    }

                    try {
                        const result = JSON.parse(stdout.trim());
                        resolve({
                            compilationSuccess: result.compilation_success ?? true,
                            compilationOutput: result.compilation_output ?? '',
                            stdout: result.stdout ?? '',
                            stderr: result.stderr ?? '',
                            exitCode: result.exit_code ?? code,
                            executionTimeMs: result.execution_time_ms ?? elapsed,
                            memoryUsageKb: result.memory_usage_kb ?? null,
                            timedOut: result.timed_out ?? false,
                            memoryExceeded: result.memory_exceeded ?? false,
                            sandboxError: false,
                        });
                    } catch {
                        resolve(this.sandboxError(`Isolyx output parse error. stdout: ${stdout.slice(0, 500)}`));
                    }
                });
            });
        } finally {
            try {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            } catch {
            }
        }
    }

    private getSourceFilename(language: string): string {
        switch (language) {
            case 'cpp': return 'main.cpp';
            case 'c':   return 'main.c';
            case 'python': return 'main.py';
            case 'java':   return 'Main.java';
            default:       return 'main.txt';
        }
    }

    private sandboxError(message: string): SandboxResult {
        return {
            compilationSuccess: false,
            compilationOutput: '',
            stdout: '',
            stderr: '',
            exitCode: null,
            executionTimeMs: 0,
            memoryUsageKb: null,
            timedOut: false,
            memoryExceeded: false,
            sandboxError: true,
            sandboxErrorMessage: message,
        };
    }
}
