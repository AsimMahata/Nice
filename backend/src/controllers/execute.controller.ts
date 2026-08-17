import { Request, Response } from 'express';
import { getSandboxExecutor } from '../sandbox/SandboxFactory.js';
import { SandboxLanguage, SandboxResult } from '../sandbox/ISandboxExecutor.js';

export type ExecutionStatus =
    | 'Accepted'
    | 'Compilation Error'
    | 'Runtime Error'
    | 'Time Limit Exceeded'
    | 'Memory Limit Exceeded'
    | 'Sandbox Error';

export interface ExecutionResponse {
    success: boolean;
    compilationSuccess: boolean;
    stdout: string;
    stderr: string;
    compilationError: string;
    exitCode: number | null;
    executionTimeMs: number;
    memoryUsageKb: number | null;
    status: ExecutionStatus;
    sandboxName?: string;
}

const SUPPORTED_LANGUAGES: SandboxLanguage[] = ['cpp', 'c', 'python', 'java'];

function mapSandboxResultToResponse(result: SandboxResult, sandboxName: string): ExecutionResponse {
    let status: ExecutionStatus;

    if (result.sandboxError) {
        status = 'Sandbox Error';
    } else if (!result.compilationSuccess) {
        status = 'Compilation Error';
    } else if (result.timedOut) {
        status = 'Time Limit Exceeded';
    } else if (result.memoryExceeded) {
        status = 'Memory Limit Exceeded';
    } else if (result.exitCode !== 0) {
        status = 'Runtime Error';
    } else {
        status = 'Accepted';
    }

    return {
        success: status === 'Accepted',
        compilationSuccess: result.compilationSuccess,
        stdout: result.stdout,
        stderr: result.stderr,
        compilationError: result.compilationSuccess ? '' : (result.compilationOutput || result.stderr),
        exitCode: result.exitCode,
        executionTimeMs: result.executionTimeMs,
        memoryUsageKb: result.memoryUsageKb,
        status,
        sandboxName,
    };
}

export const runCode = async (req: Request, res: Response): Promise<void> => {
    const { language, code, input = '' } = req.body;

    if (!language || !SUPPORTED_LANGUAGES.includes(language as SandboxLanguage)) {
        res.status(400).json({
            success: false,
            status: 'Sandbox Error',
            stderr: `Unsupported language: "${language}". Supported: ${SUPPORTED_LANGUAGES.join(', ')}`,
        });
        return;
    }

    if (!code || typeof code !== 'string' || code.trim() === '') {
        res.status(400).json({
            success: false,
            status: 'Sandbox Error',
            stderr: 'Code must be a non-empty string',
        });
        return;
    }

    const sandbox = getSandboxExecutor();
    if (!sandbox) {
        res.status(503).json({
            success: false,
            compilationSuccess: false,
            stdout: '',
            stderr: '',
            compilationError: '',
            exitCode: null,
            executionTimeMs: 0,
            memoryUsageKb: null,
            status: 'Sandbox Error' as ExecutionStatus,
            sandboxName: 'none',
        } satisfies ExecutionResponse);
        return;
    }

    try {
        const result = await sandbox.execute({
            language: language as SandboxLanguage,
            code,
            input,
            timeLimitMs: 4000,
            memoryLimitMb: 256,
        });

        const response = mapSandboxResultToResponse(result, sandbox.name);

        if (response.status === 'Accepted') {
            res.status(200).json(response);
        } else if (response.status === 'Compilation Error') {
            res.status(400).json(response);
        } else if (response.status === 'Sandbox Error') {
            res.status(503).json(response);
        } else {
            res.status(200).json(response);
        }
    } catch (err: any) {
        console.error('[execute.controller] Unexpected error:', err);
        res.status(500).json({
            success: false,
            compilationSuccess: false,
            stdout: '',
            stderr: '',
            compilationError: '',
            exitCode: null,
            executionTimeMs: 0,
            memoryUsageKb: null,
            status: 'Sandbox Error' as ExecutionStatus,
            sandboxName: sandbox.name,
        } satisfies ExecutionResponse);
    }
};
