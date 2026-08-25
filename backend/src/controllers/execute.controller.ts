import { Request, Response } from 'express';
import { getSandboxExecutor } from '../sandbox/SandboxFactory.js';
import { SandboxLanguage, SandboxResult } from '../sandbox/ISandboxExecutor.js';
import { getOnlineJudgeProvider } from '../services/onlineJudge/OnlineJudgeFactory.js';
import { ExecutionStatus as OnlineExecutionStatus } from '../services/onlineJudge/IOnlineCompilerProvider.js';

export type ExecutionStatus =
    | 'Accepted'
    | 'Success'
    | 'Compilation Error'
    | 'Runtime Error'
    | 'Time Limit Exceeded'
    | 'Memory Limit Exceeded'
    | 'API Error'
    | 'Sandbox Error';

export interface ExecutionResponse {
    success: boolean;
    compilationSuccess: boolean;
    stdout: string;
    stderr: string;
    compilationError: string;
    exception?: string | null;
    exitCode: number | null;
    executionTimeMs: number;
    compilationTimeMs?: number;
    memoryUsageKb: number | null;
    status: ExecutionStatus;
    error?: string | null;
    sandboxName?: string;
    engine?: string;
}

const SUPPORTED_SANDBOX_LANGUAGES: SandboxLanguage[] = ['cpp', 'c', 'python', 'java'];

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
        engine: 'sandbox',
    };
}

export const runCode = async (req: Request, res: Response): Promise<void> => {
    const { language, code, engine, isOnlineJudge } = req.body;
    const rawInput = typeof req.body.input === 'string' ? req.body.input : (req.body.input != null ? String(req.body.input) : '');
    const input = rawInput.replace(/\r\n/g, '\n');
    const isOnlineJudgeMode = isOnlineJudge === true || engine === 'jdoodle' || engine === 'online_judge' || req.query.mode === 'online_judge';

    if (!code || typeof code !== 'string' || code.trim() === '') {
        res.status(400).json({
            success: false,
            compilationSuccess: false,
            stdout: '',
            stderr: 'Code must be a non-empty string',
            compilationError: '',
            exitCode: null,
            executionTimeMs: 0,
            memoryUsageKb: null,
            status: 'Sandbox Error' as ExecutionStatus,
        } satisfies ExecutionResponse);
        return;
    }

    // If Online Judge mode is requested (or specified via engine flag)
    if (isOnlineJudgeMode) {
        const providerName = typeof engine === 'string' && engine !== 'online_judge' ? engine : undefined;
        const provider = getOnlineJudgeProvider(providerName);
        try {
            const ojResult = await provider.execute({ language: language || 'cpp', code, input });
            res.status(200).json({
                success: ojResult.success,
                compilationSuccess: ojResult.compilationSuccess,
                stdout: ojResult.stdout,
                stderr: ojResult.stderr,
                compilationError: ojResult.compilationError,
                exception: ojResult.exception,
                exitCode: ojResult.exitCode,
                executionTimeMs: ojResult.executionTimeMs,
                compilationTimeMs: ojResult.compilationTimeMs,
                memoryUsageKb: ojResult.memoryUsageKb,
                status: ojResult.status,
                error: ojResult.error,
                sandboxName: provider.name,
                engine: provider.name,
            } satisfies ExecutionResponse);
            return;
        } catch (err: any) {
            console.error('[execute.controller] Online judge execution error:', err);
            res.status(500).json({
                success: false,
                compilationSuccess: false,
                stdout: '',
                stderr: `Online judge error: ${err.message}`,
                compilationError: '',
                exitCode: null,
                executionTimeMs: 0,
                memoryUsageKb: null,
                status: 'API Error' as ExecutionStatus,
                error: err.message,
                sandboxName: provider.name,
            } satisfies ExecutionResponse);
            return;
        }
    }

    // Default Sandbox execution mode
    if (!language || !SUPPORTED_SANDBOX_LANGUAGES.includes(language as SandboxLanguage)) {
        // Fall back to Online Judge if unsupported by sandbox
        const provider = getOnlineJudgeProvider();
        try {
            const ojResult = await provider.execute({ language: language || 'cpp', code, input });
            res.status(200).json({
                success: ojResult.success,
                compilationSuccess: ojResult.compilationSuccess,
                stdout: ojResult.stdout,
                stderr: ojResult.stderr,
                compilationError: ojResult.compilationError,
                exception: ojResult.exception,
                exitCode: ojResult.exitCode,
                executionTimeMs: ojResult.executionTimeMs,
                compilationTimeMs: ojResult.compilationTimeMs,
                memoryUsageKb: ojResult.memoryUsageKb,
                status: ojResult.status,
                error: ojResult.error,
                sandboxName: provider.name,
                engine: provider.name,
            } satisfies ExecutionResponse);
            return;
        } catch (err: any) {
            res.status(400).json({
                success: false,
                compilationSuccess: false,
                stdout: '',
                stderr: `Unsupported language for sandbox: "${language}". Fallback failed: ${err.message}`,
                compilationError: '',
                exitCode: null,
                executionTimeMs: 0,
                memoryUsageKb: null,
                status: 'Sandbox Error' as ExecutionStatus,
            } satisfies ExecutionResponse);
            return;
        }
    }

    const sandbox = getSandboxExecutor();
    if (!sandbox) {
        // If sandbox is not available, attempt online judge fallback
        const provider = getOnlineJudgeProvider();
        try {
            const ojResult = await provider.execute({ language: language as SandboxLanguage, code, input });
            res.status(200).json({
                success: ojResult.success,
                compilationSuccess: ojResult.compilationSuccess,
                stdout: ojResult.stdout,
                stderr: ojResult.stderr,
                compilationError: ojResult.compilationError,
                exception: ojResult.exception,
                exitCode: ojResult.exitCode,
                executionTimeMs: ojResult.executionTimeMs,
                compilationTimeMs: ojResult.compilationTimeMs,
                memoryUsageKb: ojResult.memoryUsageKb,
                status: ojResult.status,
                error: ojResult.error,
                sandboxName: provider.name,
                engine: provider.name,
            } satisfies ExecutionResponse);
            return;
        } catch {
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
        res.status(200).json(response);
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
