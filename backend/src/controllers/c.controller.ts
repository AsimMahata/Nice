import { Request, Response } from 'express';
import { getSandboxExecutor } from '../sandbox/SandboxFactory.js';

export const runCode = async (req: Request, res: Response): Promise<void> => {
    const { code, input = '' } = req.body;

    if (!code) {
        res.status(400).send({ success: false, error: 'code is required', compilationError: '', runtimeError: '', output: '' });
        return;
    }

    const sandbox = getSandboxExecutor();
    if (!sandbox) {
        res.status(503).send({ success: false, error: 'Sandbox Error: No sandbox available', compilationError: '', runtimeError: '', output: '' });
        return;
    }

    const result = await sandbox.execute({ language: 'c', code, input, timeLimitMs: 4000, memoryLimitMb: 256 });

    const status = {
        success: result.exitCode === 0 && !result.timedOut && !result.memoryExceeded && !result.sandboxError && result.compilationSuccess,
        output: result.stdout,
        error: result.sandboxError ? 'Sandbox Error' : result.timedOut ? 'Time Limit Exceeded' : result.memoryExceeded ? 'Memory Limit Exceeded' : result.exitCode !== 0 && result.compilationSuccess ? 'Runtime Error' : '',
        runtimeError: result.stderr,
        compilationError: result.compilationSuccess ? '' : (result.compilationOutput || result.stderr),
    };

    if (!result.compilationSuccess) {
        res.status(400).send(status);
        return;
    }
    if (result.sandboxError) {
        res.status(503).send(status);
        return;
    }
    res.send(status);
};

export const compileCode = async (req: Request, res: Response): Promise<void> => {
    const { code } = req.body;

    if (!code) {
        res.status(400).send('code is required');
        return;
    }

    const sandbox = getSandboxExecutor();
    if (!sandbox) {
        res.status(503).send('Sandbox Error: No sandbox available');
        return;
    }

    const result = await sandbox.execute({ language: 'c', code, input: '', timeLimitMs: 4000, memoryLimitMb: 256 });

    if (!result.compilationSuccess) {
        res.status(400).send(result.compilationOutput || result.stderr || 'Compilation failed');
        return;
    }
    res.status(200).send('Compiled Successfully');
};