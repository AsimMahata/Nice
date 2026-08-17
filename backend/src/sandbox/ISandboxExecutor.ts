export type SandboxLanguage = 'cpp' | 'c' | 'python' | 'java';

export interface SandboxRequest {
    language: SandboxLanguage;
    code: string;
    input: string;
    timeLimitMs: number;
    memoryLimitMb: number;
}

export interface SandboxResult {
    compilationSuccess: boolean;
    compilationOutput: string;
    stdout: string;
    stderr: string;
    exitCode: number | null;
    executionTimeMs: number;
    memoryUsageKb: number | null;
    timedOut: boolean;
    memoryExceeded: boolean;
    sandboxError: boolean;
    sandboxErrorMessage?: string;
}

export interface ISandboxExecutor {
    isAvailable(): Promise<boolean>;
    execute(req: SandboxRequest): Promise<SandboxResult>;
    readonly name: string;
}
