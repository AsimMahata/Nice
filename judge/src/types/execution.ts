export interface ExecutionRequest {
    language: string;
    source: string;
    stdin?: string;
}

export interface ExecutionResult {
    status: "success" | "failed";
    stdout: string;
    stderr: string | null;
    exception: string | null;
    error: string | null;
    compilationTime?: number;
    executionTime?: number;
    memoryUsed?: number;
}

export interface ExecutionProvider {
    readonly name: string;
    execute(request: ExecutionRequest): Promise<ExecutionResult>;
}
