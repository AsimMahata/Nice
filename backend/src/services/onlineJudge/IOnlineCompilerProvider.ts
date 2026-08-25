export type ExecutionStatus =
    | 'Accepted'
    | 'Success'
    | 'Compilation Error'
    | 'Runtime Error'
    | 'Time Limit Exceeded'
    | 'Memory Limit Exceeded'
    | 'API Error'
    | 'Sandbox Error';

export interface OnlineJudgeRequest {
    language: string;
    code: string;
    input: string;
}

export interface OnlineJudgeResult {
    success: boolean;
    compilationSuccess: boolean;
    stdout: string;
    stderr: string;
    compilationError: string;
    exception: string | null;
    exitCode: number | null;
    executionTimeMs: number;
    compilationTimeMs?: number;
    memoryUsageKb: number | null;
    status: ExecutionStatus;
    error: string | null;
    sandboxName?: string;
    engine?: string;
}

export interface IOnlineCompilerProvider {
    readonly name: string;
    execute(req: OnlineJudgeRequest): Promise<OnlineJudgeResult>;
}
