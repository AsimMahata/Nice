export interface JudgeExecutionRequest {
    language: string;
    source: string;
    stdin?: string;
}

export interface JudgeExecutionResult {
    status: 'success' | 'failed';
    stdout: string;
    stderr: string | null;
    exception: string | null;
    error: string | null;
    compilationTime?: number;
    executionTime?: number;
    memoryUsed?: number;
}

export class JudgeClient {
    private getJudgeUrl(): string {
        return (process.env.JUDGE_SERVICE_URL || 'http://localhost:5001').replace(/\/$/, '');
    }

    async execute(request: JudgeExecutionRequest, timeoutMs: number = 35000): Promise<JudgeExecutionResult> {
        const url = `${this.getJudgeUrl()}/execute`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
                signal: controller.signal,
            });

            const data = (await response.json()) as JudgeExecutionResult;
            return data;
        } catch (err: any) {
            const isTimeout = err.name === 'AbortError' || err?.message?.includes('timed out');
            const message = isTimeout ? 'Judge service request timed out' : `Judge service unavailable: ${err?.message || 'Connection failed'}`;
            const error = new Error(message);
            (error as any).isJudgeUnavailable = true;
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    async healthCheck(): Promise<boolean> {
        try {
            const response = await fetch(`${this.getJudgeUrl()}/health`, { method: 'GET' });
            if (!response.ok) return false;
            const data: any = await response.json();
            return data?.status === 'ok';
        } catch {
            return false;
        }
    }
}

export const judgeClient = new JudgeClient();
