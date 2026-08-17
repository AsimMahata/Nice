export type ExecutionStatus =
    | 'Accepted'
    | 'Compilation Error'
    | 'Runtime Error'
    | 'Time Limit Exceeded'
    | 'Memory Limit Exceeded'
    | 'Sandbox Error';

export interface ExecutionResult {
    success: boolean;
    compilationSuccess: boolean;
    stdout: string;
    stderr: string;
    compilationError: string;
    exitCode: number | null;
    executionTimeMs: number;
    memoryUsageKb: number | null;
    status: ExecutionStatus;
    source: 'local' | 'backend';
}

export interface ExecutionRequest {
    language: string;
    filePath?: string;
    code?: string;
    input: string;
    timeLimitMs?: number;
}

export interface CphCompileResult {
    success: boolean;
    error?: string;
    binaryPath?: string;
    backendFallback?: boolean;
    language?: string;
    code?: string;
}

export interface CphRunResult {
    stdout: string;
    stderr: string;
    exitCode: number | null;
    time: number;
    timeout: boolean;
    memoryExceeded?: boolean;
    error?: string;
    source: 'local' | 'backend';
    status: ExecutionStatus;
}
