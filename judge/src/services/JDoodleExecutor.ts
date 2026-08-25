import { ExecutionProvider, ExecutionRequest, ExecutionResult } from '../types/execution.js';
import { logger } from '../utils/logger.js';

const log = logger.createScope('JDoodle');

interface JDoodleLangConfig {
    language: string;
    versionIndex: string;
}

const JDOODLE_LANGUAGE_MAP: Record<string, JDoodleLangConfig> = {
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
    'nodejs': { language: 'nodejs', versionIndex: '4' },
    'typescript': { language: 'typescript', versionIndex: '4' },
    'ts': { language: 'typescript', versionIndex: '4' },
    'go': { language: 'go', versionIndex: '4' },
    'golang': { language: 'go', versionIndex: '4' },
    'rust': { language: 'rust', versionIndex: '4' },
    'rs': { language: 'rust', versionIndex: '4' },
    'php': { language: 'php', versionIndex: '4' },
    'ruby': { language: 'ruby', versionIndex: '4' },
};

export class JDoodleExecutor implements ExecutionProvider {
    readonly name = 'JDoodle';

    private getApiUrl(): string {
        return process.env.JDOODLE_API_URL || process.env.ONLINE_JUDGE_API_URL || 'https://api.jdoodle.com/v1/execute';
    }

    private getCredentials(): { clientId?: string; clientSecret?: string } {
        return {
            clientId: process.env.JDOODLE_CLIENT_ID || process.env.ONLINE_JUDGE_CLIENT_ID,
            clientSecret: process.env.JDOODLE_CLIENT_SECRET || process.env.ONLINE_JUDGE_CLIENT_SECRET,
        };
    }

    private resolveLanguageConfig(langInput: string): JDoodleLangConfig {
        const key = (langInput || '').toLowerCase().trim();
        return JDOODLE_LANGUAGE_MAP[key] || { language: key || 'python3', versionIndex: '0' };
    }

    async execute(request: ExecutionRequest): Promise<ExecutionResult> {
        const { clientId, clientSecret } = this.getCredentials();

        if (!clientId || !clientSecret) {
            log.error('JDoodle execution aborted: Credentials are not configured in environment.');
            return {
                status: 'failed',
                stdout: '',
                stderr: null,
                exception: null,
                error: 'JDoodle credentials (JDOODLE_CLIENT_ID / JDOODLE_CLIENT_SECRET) are not configured in Judge Service.',
            };
        }

        const langConfig = this.resolveLanguageConfig(request.language);
        const payload = {
            clientId,
            clientSecret,
            script: request.source,
            stdin: request.stdin ?? '',
            language: langConfig.language,
            versionIndex: langConfig.versionIndex,
            compileOnly: false,
        };

        const apiUrl = this.getApiUrl();
        log.info(`Sending execution request to JDoodle API (language=${langConfig.language}, versionIndex=${langConfig.versionIndex})...`);

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
                log.error(`JDoodle API returned HTTP ${response.status}: ${errorText || response.statusText}`);
                return {
                    status: 'failed',
                    stdout: '',
                    stderr: null,
                    exception: null,
                    error: `JDoodle API Error (${response.status}): ${errorText || response.statusText}`,
                };
            }

            const data: any = await response.json();
            log.info(`Received response from JDoodle API (cpuTime=${data.cpuTime ?? 'N/A'}, memory=${data.memory ?? 'N/A'})`);
            return this.normalizeResponse(data);
        } catch (err: any) {
            log.error(`Failed to communicate with JDoodle API: ${err.message}`);
            return {
                status: 'failed',
                stdout: '',
                stderr: null,
                exception: null,
                error: `Failed to communicate with JDoodle API: ${err.message}`,
            };
        }
    }

    private normalizeResponse(data: any): ExecutionResult {
        if (data.error) {
            return {
                status: 'failed',
                stdout: '',
                stderr: String(data.error),
                exception: null,
                error: String(data.error),
            };
        }

        const outputText = typeof data.output === 'string' ? data.output : '';
        const compilationStatus = data.compilationStatus;
        const compilationFailed = compilationStatus !== undefined && compilationStatus !== 0 && compilationStatus !== null;

        const cpuTimeSec = parseFloat(data.cpuTime ?? '0');
        const executionTime = isNaN(cpuTimeSec) ? undefined : Math.round(cpuTimeSec * 1000);
        const memoryUsed = data.memory ? parseInt(data.memory, 10) : undefined;

        const isRuntimeError = outputText.includes('Runtime Error') ||
            outputText.includes('Exception in thread') ||
            outputText.includes('Traceback (most recent call last):');

        if (compilationFailed) {
            return {
                status: 'failed',
                stdout: '',
                stderr: outputText,
                exception: null,
                error: null,
                executionTime,
                memoryUsed,
            };
        }

        if (isRuntimeError) {
            return {
                status: 'failed',
                stdout: outputText,
                stderr: outputText,
                exception: outputText,
                error: null,
                executionTime,
                memoryUsed,
            };
        }

        return {
            status: 'success',
            stdout: outputText,
            stderr: null,
            exception: null,
            error: null,
            executionTime,
            memoryUsed,
        };
    }
}
