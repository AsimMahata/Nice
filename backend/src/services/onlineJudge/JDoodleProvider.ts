import { IOnlineCompilerProvider, OnlineJudgeRequest, OnlineJudgeResult, ExecutionStatus } from './IOnlineCompilerProvider.js';

const JDOODLE_LANGUAGE_MAP: Record<string, { language: string; versionIndex: string }> = {
    'cpp': { language: 'cpp', versionIndex: '5' },
    'c++': { language: 'cpp', versionIndex: '5' },
    'cc': { language: 'cpp', versionIndex: '5' },
    'cxx': { language: 'cpp', versionIndex: '5' },
    'c': { language: 'c', versionIndex: '5' },
    'python': { language: 'python3', versionIndex: '4' },
    'py': { language: 'python3', versionIndex: '4' },
    'python3': { language: 'python3', versionIndex: '4' },
    'java': { language: 'java', versionIndex: '4' },
    'javascript': { language: 'nodejs', versionIndex: '4' },
    'js': { language: 'nodejs', versionIndex: '4' },
    'typescript': { language: 'typescript', versionIndex: '4' },
    'ts': { language: 'typescript', versionIndex: '4' },
    'go': { language: 'go', versionIndex: '4' },
    'rust': { language: 'rust', versionIndex: '4' },
    'rs': { language: 'rust', versionIndex: '4' },
    'php': { language: 'php', versionIndex: '4' },
    'ruby': { language: 'ruby', versionIndex: '4' },
};

export class JDoodleProvider implements IOnlineCompilerProvider {
    readonly name = 'JDoodle';

    async execute(req: OnlineJudgeRequest): Promise<OnlineJudgeResult> {
        const clientId = process.env.JDOODLE_CLIENT_ID || process.env.ONLINE_JUDGE_CLIENT_ID;
        const clientSecret = process.env.JDOODLE_CLIENT_SECRET || process.env.ONLINE_JUDGE_CLIENT_SECRET;
        const apiUrl = process.env.ONLINE_JUDGE_API_URL || 'https://api.jdoodle.com/v1/execute';

        if (!clientId || !clientSecret) {
            return {
                success: false,
                compilationSuccess: false,
                stdout: '',
                stderr: 'JDoodle API error: JDOODLE_CLIENT_ID or JDOODLE_CLIENT_SECRET is missing in backend configuration.',
                compilationError: '',
                exception: null,
                exitCode: null,
                executionTimeMs: 0,
                memoryUsageKb: null,
                status: 'API Error',
                error: 'Missing client credentials',
                engine: this.name,
            };
        }

        const langKey = (req.language || '').toLowerCase().trim();
        const mapped = JDOODLE_LANGUAGE_MAP[langKey] || { language: langKey || 'python3', versionIndex: '0' };

        const payload = {
            clientId,
            clientSecret,
            script: req.code,
            stdin: req.input || '',
            language: mapped.language,
            versionIndex: mapped.versionIndex,
            compileOnly: false,
        };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                return {
                    success: false,
                    compilationSuccess: false,
                    stdout: '',
                    stderr: `JDoodle API Error (${response.status}): ${errorText || response.statusText}`,
                    compilationError: '',
                    exception: null,
                    exitCode: null,
                    executionTimeMs: 0,
                    memoryUsageKb: null,
                    status: 'API Error',
                    error: `API returned HTTP ${response.status}`,
                    engine: this.name,
                };
            }

            const data = await response.json();

            // JDoodle returns: output, statusCode, memory, cpuTime, compilationStatus, error
            if (data.error) {
                return {
                    success: false,
                    compilationSuccess: false,
                    stdout: '',
                    stderr: `JDoodle Error: ${data.error}`,
                    compilationError: '',
                    exception: null,
                    exitCode: null,
                    executionTimeMs: 0,
                    memoryUsageKb: null,
                    status: 'API Error',
                    error: String(data.error),
                    engine: this.name,
                };
            }

            const outputText = data.output || '';
            const compilationStatus = data.compilationStatus;
            const compilationFailed = compilationStatus !== undefined && compilationStatus !== 0 && compilationStatus !== null;

            // cpuTime is in seconds (string or number), convert to ms
            const cpuTimeSec = parseFloat(data.cpuTime ?? '0');
            const executionTimeMs = isNaN(cpuTimeSec) ? 0 : Math.round(cpuTimeSec * 1000);

            // memory is in KB (string or number)
            const memoryUsageKb = data.memory ? parseInt(data.memory, 10) : null;

            let status: ExecutionStatus;
            let success = false;
            let compilationSuccess = true;

            if (compilationFailed) {
                status = 'Compilation Error';
                compilationSuccess = false;
            } else if (outputText.includes('Runtime Error') || outputText.includes('Exception in thread')) {
                status = 'Runtime Error';
                compilationSuccess = true;
            } else {
                status = 'Accepted';
                compilationSuccess = true;
                success = true;
            }

            return {
                success,
                compilationSuccess,
                stdout: compilationSuccess ? outputText : '',
                stderr: !compilationSuccess ? outputText : '',
                compilationError: !compilationSuccess ? outputText : '',
                exception: null,
                exitCode: success ? 0 : 1,
                executionTimeMs,
                memoryUsageKb: isNaN(memoryUsageKb as number) ? null : memoryUsageKb,
                status,
                error: null,
                engine: this.name,
            };
        } catch (err: any) {
            console.error('[JDoodleProvider] Request failed:', err);
            return {
                success: false,
                compilationSuccess: false,
                stdout: '',
                stderr: `Failed to communicate with JDoodle API: ${err.message}`,
                compilationError: '',
                exception: null,
                exitCode: null,
                executionTimeMs: 0,
                memoryUsageKb: null,
                status: 'API Error',
                error: err.message,
                engine: this.name,
            };
        }
    }
}
