import { FileInfo } from "../../services/FileSystem/file.options";
import { CodeRunnerParams } from "./code.options";

declare global {
    interface Window {
        runner?: {
            runCode: (codeFile: FileInfo) => Promise<{ usedBackend: boolean; result: any | null }>;
            probeCompiler: (language: string) => Promise<boolean>;
            runCodeBackend: (params: { filePath: string; language: string; code: string; input: string }) => Promise<any>;
        };
    }
}

class CodeManager {
    time = Date.now()

    onBackendResult: ((result: any) => void) | null = null;

    constructor() {
        console.log("CodeManager constructor called");
    }

    async runCode({ codeFile, codeLang, cwd }: CodeRunnerParams) {
        console.log('----------called run code for ', codeFile, codeLang, cwd);

        if (!window.runner) {
            console.error('window.runner is not defined')
            return;
        }
        if (!cwd) {
            console.error('please open a Directory first to run code');
            return;
        }

        try {
            const response = await window.runner.runCode(codeFile);

            if (response?.usedBackend && response?.result) {
                console.log('[CodeManager] Backend fallback result received:', response.result);
                this.onBackendResult?.(response.result);
            }
        } catch (err) {
            console.error('[CodeManager] Error running code:', err);
            throw err;
        }
    }
}

export const codeManager = new CodeManager()
