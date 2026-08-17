import { isCompilerAvailable } from './compilerProbe';
import { localExecutor } from './LocalExecutor';
import { backendExecutor } from './BackendExecutor';
import {
    ExecutionRequest,
    ExecutionResult,
    CphCompileResult,
    CphRunResult,
} from './ExecutionTypes';

export class ExecutionService {

    async runCode(
        req: ExecutionRequest,
        mode: 'auto' | 'local' | 'online' = 'auto'
    ): Promise<{ result: ExecutionResult; usedBackend: boolean }> {
        if (mode === 'online') {
            console.log(`[ExecutionService] Execution mode set to online. Executing via backend.`);
            const result = await backendExecutor.execute(req);
            return { result, usedBackend: true };
        }

        if (mode === 'local') {
            console.log(`[ExecutionService] Execution mode set to local. Executing locally.`);
            const result = await localExecutor.runViaTerminal(req);
            return { result, usedBackend: false };
        }

        const hasLocal = await isCompilerAvailable(req.language);

        if (hasLocal) {
            const result = await localExecutor.runViaTerminal(req);
            return { result, usedBackend: false };
        }

        console.log(`[ExecutionService] No local compiler for ${req.language}, falling back to backend.`);
        const result = await backendExecutor.execute(req);
        return { result, usedBackend: true };
    }

    async compileCph(filePath: string, language: string, mode: 'auto' | 'local' | 'online' = 'auto'): Promise<CphCompileResult> {
        if (mode === 'online') {
            return backendExecutor.compileCph(filePath, language);
        }

        if (mode === 'local') {
            return localExecutor.compileCph(filePath);
        }

        const hasLocal = await isCompilerAvailable(language);

        if (hasLocal) {
            return localExecutor.compileCph(filePath);
        }

        console.log(`[ExecutionService] No local compiler for ${language}, compiling via backend.`);
        return backendExecutor.compileCph(filePath, language);
    }

    async runCphTestcase(
        binaryPath: string,
        input: string,
        timeLimitMs: number,
        language?: string,
        code?: string,
    ): Promise<CphRunResult> {
        const isBackendMode = !binaryPath || binaryPath === '';

        if (!isBackendMode) {
            return localExecutor.runCphTestcase(binaryPath, input, timeLimitMs);
        }

        if (!language || !code) {
            return {
                stdout: '',
                stderr: 'Backend mode requires language and code',
                exitCode: null,
                time: 0,
                timeout: false,
                error: 'Missing language/code for backend execution',
                source: 'backend',
                status: 'Sandbox Error',
            };
        }

        return backendExecutor.runCphTestcase(language, code, input, timeLimitMs);
    }

    async probeCompiler(language: string): Promise<boolean> {
        return isCompilerAvailable(language);
    }
}

export const executionService = new ExecutionService();
