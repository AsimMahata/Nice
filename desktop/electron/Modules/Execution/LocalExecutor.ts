import fs from 'fs';
import { ptyManager } from '../Terminal/terminal';
import { commandBuilder, attachCommands } from '../CodeRunner/CodeRunner';
import { getStepsToRun } from '../CodeRunner/LanguageRegistry';
import { compileCPH, runTestcaseCPH } from '../CPH/cphJudge';
import { ExecutionRequest, ExecutionResult, CphCompileResult, CphRunResult } from './ExecutionTypes';

export class LocalExecutor {

    async runViaTerminal(req: ExecutionRequest): Promise<ExecutionResult> {
        if (!req.filePath) {
            throw new Error('LocalExecutor.runViaTerminal: filePath is required');
        }

        const path = await import('path');
        const parsed = path.default.parse(req.filePath);

        const ext = parsed.ext;
        const lang = req.language;

        const metadata = {
            filePath: req.filePath,
            fileName: parsed.base,
            fileNameWithoutExt: parsed.name,
            fileExtension: ext,
            directory: parsed.dir,
            codeLang: lang,
        };

        const steps = getStepsToRun(metadata);
        const commands = commandBuilder(steps, metadata);
        const shellType = process.platform === 'win32' ? 'powershell' : 'bash';
        const command = attachCommands(commands, shellType);

        await ptyManager.run(command);

        return {
            success: true,
            compilationSuccess: true,
            stdout: '',
            stderr: '',
            compilationError: '',
            exitCode: 0,
            executionTimeMs: 0,
            memoryUsageKb: null,
            status: 'Accepted',
            source: 'local',
        };
    }

    async compileCph(filePath: string): Promise<CphCompileResult> {
        const result = await compileCPH(filePath);
        return {
            success: result.success,
            error: result.error,
            binaryPath: result.binaryPath,
            backendFallback: false,
        };
    }

    async runCphTestcase(
        binaryPath: string,
        input: string,
        timeLimit: number = 2000
    ): Promise<CphRunResult> {
        const result = await runTestcaseCPH(binaryPath, input, timeLimit);
        return {
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: result.exitCode,
            time: result.time,
            timeout: result.timeout,
            error: result.error,
            source: 'local',
            status: result.timeout ? 'Time Limit Exceeded' : result.exitCode !== 0 ? 'Runtime Error' : 'Accepted',
        };
    }
}

export const localExecutor = new LocalExecutor();
