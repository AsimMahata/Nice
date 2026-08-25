import { Request, Response } from 'express';
import { judgeService } from '../services/JudgeService.js';
import { ExecutionRequest, ExecutionResult } from '../types/execution.js';
import { logger } from '../utils/logger.js';

const log = logger.createScope('Controller');

export const executeCode = async (req: Request, res: Response): Promise<void> => {
    const { language, source, stdin } = req.body as ExecutionRequest;
    const sourceLen = typeof source === 'string' ? source.length : 0;
    const stdinLen = typeof stdin === 'string' ? stdin.length : 0;

    log.info(`Incoming execution request: language="${language || ''}", sourceLength=${sourceLen} chars, stdinLength=${stdinLen} chars`);

    if (!language || typeof language !== 'string' || language.trim() === '') {
        log.warn('Execution rejected: Missing or invalid language field');
        res.status(400).json({
            status: 'failed',
            stdout: '',
            stderr: null,
            exception: null,
            error: 'Field "language" is required and must be a non-empty string.',
        } satisfies ExecutionResult);
        return;
    }

    if (source === undefined || source === null || typeof source !== 'string' || source.trim() === '') {
        log.warn('Execution rejected: Missing or empty source code');
        res.status(400).json({
            status: 'failed',
            stdout: '',
            stderr: null,
            exception: null,
            error: 'Field "source" is required and must be a non-empty string.',
        } satisfies ExecutionResult);
        return;
    }

    try {
        const startTime = Date.now();
        const result = await judgeService.execute({
            language,
            source,
            stdin: typeof stdin === 'string' ? stdin : '',
        });
        const elapsed = Date.now() - startTime;

        log.info(
            `Execution finished for "${language}": status=${result.status}, executionTime=${result.executionTime ?? 0}ms, compilationTime=${result.compilationTime ?? 0}ms, duration=${elapsed}ms`
        );

        if (result.stderr) {
            log.warn(`Execution stderr: ${result.stderr.slice(0, 300).replace(/\r?\n/g, ' ')}`);
        }
        if (result.error) {
            log.error(`Execution error: ${result.error}`);
        }

        res.status(200).json(result);
    } catch (err: any) {
        log.error('Unhandled execution exception:', err.message);
        res.status(500).json({
            status: 'failed',
            stdout: '',
            stderr: null,
            exception: null,
            error: `Internal judge service error: ${err?.message || 'Unknown error'}`,
        } satisfies ExecutionResult);
    }
};
