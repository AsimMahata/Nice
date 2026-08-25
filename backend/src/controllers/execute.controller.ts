import { Request, Response } from 'express';
import { judgeClient, JudgeExecutionResult } from '../services/judge/JudgeClient.js';

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

function isCompilationFailure(result: JudgeExecutionResult): boolean {
    const errorText = `${result.error || ''}\n${result.stderr || ''}`;
    
    if (result.exception) {
        return false;
    }

    if (
        errorText.includes('SyntaxError') ||
        errorText.includes('IndentationError') ||
        errorText.includes('error:') ||
        errorText.includes('fatal error:') ||
        errorText.includes('undefined reference') ||
        errorText.includes('cannot find symbol') ||
        errorText.includes('error TS') ||
        errorText.includes('syntax error:') ||
        errorText.includes('error[E')
    ) {
        return true;
    }

    if (result.status === 'failed' && (result.stderr || result.error) && !result.stdout && !result.exception) {
        return true;
    }

    return false;
}

function mapJudgeResultToResponse(result: JudgeExecutionResult): ExecutionResponse {
    const isCompError = isCompilationFailure(result);
    const hasException = Boolean(result.exception);
    const hasError = Boolean(result.error && !isCompError);

    let status: ExecutionStatus;
    let success = false;
    let compilationSuccess = true;
    let exitCode: number | null = 0;

    if (isCompError) {
        status = 'Compilation Error';
        compilationSuccess = false;
        exitCode = 1;
    } else if (hasException) {
        status = 'Runtime Error';
        compilationSuccess = true;
        exitCode = 1;
    } else if (hasError || result.status === 'failed') {
        status = 'API Error';
        compilationSuccess = false;
        exitCode = null;
    } else {
        status = 'Accepted';
        compilationSuccess = true;
        success = true;
        exitCode = 0;
    }

    const compilationError = !compilationSuccess ? (result.stderr || result.error || '') : '';
    const stderr = isCompError ? (result.stderr || '') : (result.exception || result.stderr || result.error || '');

    return {
        success,
        compilationSuccess,
        stdout: result.stdout || '',
        stderr,
        compilationError,
        exception: result.exception || null,
        exitCode,
        executionTimeMs: result.executionTime ?? 0,
        compilationTimeMs: result.compilationTime,
        memoryUsageKb: result.memoryUsed != null ? result.memoryUsed : null,
        status,
        error: result.error || null,
        sandboxName: 'JudgeService',
        engine: 'JudgeService',
    };
}

export const runCode = async (req: Request, res: Response): Promise<void> => {
    const { language, code } = req.body;
    const rawInput = typeof req.body.input === 'string' ? req.body.input : (req.body.input != null ? String(req.body.input) : '');
    const stdin = rawInput.replace(/\r\n/g, '\n');

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

    try {
        const judgeResult = await judgeClient.execute({
            language: language || 'cpp',
            source: code,
            stdin,
        });

        const response = mapJudgeResultToResponse(judgeResult);
        res.status(200).json(response);
    } catch (err: any) {
        console.error('[execute.controller] Judge service error:', err.message);
        const isJudgeUnavailable = err.isJudgeUnavailable || err.message?.includes('unavailable') || err.message?.includes('ECONNREFUSED');
        
        res.status(isJudgeUnavailable ? 503 : 500).json({
            success: false,
            compilationSuccess: false,
            stdout: '',
            stderr: err.message || 'Judge service unavailable',
            compilationError: '',
            exitCode: null,
            executionTimeMs: 0,
            memoryUsageKb: null,
            status: 'Sandbox Error' as ExecutionStatus,
            error: err.message || 'Judge service unavailable',
            sandboxName: 'JudgeService',
            engine: 'JudgeService',
        } satisfies ExecutionResponse);
    }
};

