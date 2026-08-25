import https from 'https';
import http from 'http';
import { ExecutionRequest, ExecutionResult, ExecutionStatus, CphCompileResult, CphRunResult } from './ExecutionTypes';

export class BackendExecutor {

    private readonly backendUrl: string;

    constructor() {
        this.backendUrl = (process.env.VITE_API_URL || process.env.BACKEND_URL || 'http://localhost:3000/api').replace(/\/$/, '');
    }

    async execute(req: ExecutionRequest): Promise<ExecutionResult> {
        let code = req.code;

        if (!code && req.filePath) {
            const fs = await import('fs');
            code = fs.default.readFileSync(req.filePath, 'utf8');
        }

        if (!code) {
            return this.errorResult('BackendExecutor: no code provided');
        }

        const payload = JSON.stringify({
            language: req.language,
            code,
            input: req.input,
        });

        try {
            // 30s HTTP timeout: allow generous headroom for network transfer + queueing + compilation
            const response = await this.postJson(`${this.backendUrl}/execute/run`, payload, 30000);
            return this.mapResponse(response);
        } catch (err: any) {
            console.error('[BackendExecutor] Request failed:', err.message);
            return this.errorResult(`Backend error: ${err.message}`);
        }
    }

    async compileCph(filePath: string, language: string): Promise<CphCompileResult> {
        const fs = await import('fs');
        let code: string;
        try {
            code = fs.default.readFileSync(filePath, 'utf8');
        } catch (err: any) {
            return { success: false, error: `Failed to read file: ${err.message}`, backendFallback: true };
        }

        return {
            success: true,
            backendFallback: true,
            language,
            code,
        };
    }

    async runCphTestcase(
        language: string,
        code: string,
        input: string,
        _timeLimitMs: number = 5000
    ): Promise<CphRunResult> {
        const payload = JSON.stringify({ language, code, input });
        try {
           
            const response = await this.postJson(`${this.backendUrl}/execute/run`, payload, 30000);
            const isTLE = response.status === 'Time Limit Exceeded' || response.error === 'Time Limit Exceeded';

            return {
                stdout: response.stdout ?? '',
                stderr: response.stderr ?? '',
                exitCode: response.exitCode ?? null,
                time: response.executionTimeMs ?? 0,
                timeout: isTLE,
                memoryExceeded: response.status === 'Memory Limit Exceeded',
                error: response.status !== 'Accepted' ? (response.status || response.error) : undefined,
                source: 'backend',
                status: (response.status as ExecutionStatus) ?? 'Runtime Error',
            };
        } catch (err: any) {
            return {
                stdout: '',
                stderr: `Backend unreachable: ${err.message}`,
                exitCode: null,
                time: 0,
                timeout: false,
                error: `Backend unreachable: ${err.message}`,
                source: 'backend',
                status: 'Sandbox Error',
            };
        }
    }

    private postJson(url: string, body: string, timeoutMs: number = 30000): Promise<any> {
        return new Promise((resolve, reject) => {
            const parsed = new URL(url);
            const isHttps = parsed.protocol === 'https:';
            const lib = isHttps ? https : http;

            const options = {
                hostname: parsed.hostname,
                port: parsed.port || (isHttps ? 443 : 80),
                path: parsed.pathname + (parsed.search || ''),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body),
                },
                timeout: timeoutMs,
            };

            const req = lib.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch {
                        reject(new Error(`Invalid JSON response: ${data.slice(0, 200)}`));
                    }
                });
            });

            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error(`HTTP request timed out after ${Math.round(timeoutMs / 1000)}s`));
            });
            req.write(body);
            req.end();
        });
    }

    private mapResponse(r: any): ExecutionResult {
        const status: ExecutionStatus = r.status ?? 'Sandbox Error';
        return {
            success: r.success ?? false,
            compilationSuccess: r.compilationSuccess ?? false,
            stdout: r.stdout ?? '',
            stderr: r.stderr ?? '',
            compilationError: r.compilationError ?? '',
            exitCode: r.exitCode ?? null,
            executionTimeMs: r.executionTimeMs ?? 0,
            memoryUsageKb: r.memoryUsageKb ?? null,
            status,
            source: 'backend',
        };
    }

    private errorResult(message: string): ExecutionResult {
        return {
            success: false,
            compilationSuccess: false,
            stdout: '',
            stderr: message,
            compilationError: '',
            exitCode: null,
            executionTimeMs: 0,
            memoryUsageKb: null,
            status: 'Sandbox Error',
            source: 'backend',
        };
    }
}

export const backendExecutor = new BackendExecutor();
