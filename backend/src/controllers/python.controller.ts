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

    const result = await sandbox.execute({ language: 'python', code, input, timeLimitMs: 4000, memoryLimitMb: 256 });

    const status = {
        success: result.exitCode === 0 && !result.timedOut && !result.memoryExceeded && !result.sandboxError,
        output: result.stdout,
        error: result.sandboxError ? 'Sandbox Error' : result.timedOut ? 'Time Limit Exceeded' : result.memoryExceeded ? 'Memory Limit Exceeded' : result.exitCode !== 0 ? result.stderr : '',
        runtimeError: result.stderr,
        compilationError: '',
    };

    if (result.sandboxError) {
        res.status(503).send(status);
        return;
    }
    if (!status.success) {
        res.status(500).send(status);
        return;
    }
    res.send(status);
};
