import { FileInfo } from "../../services/FileSystem/file.options";
import { CodeRunnerParams } from "./code.options";
import { logger } from "../../services/Logger/Logger";

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
        logger.info("CodeManager", "CodeManager constructor initialized");
    }

    async runCode({ codeFile, codeLang, cwd }: CodeRunnerParams) {
        logger.info("CodeManager", "Run code invoked for", codeFile, codeLang, cwd);

        if (!window.runner) {
            logger.error("CodeManager", "window.runner is not defined");
            return;
        }
        if (!cwd) {
            logger.error("CodeManager", "Please open a Directory first to run code");
            return;
        }

        try {
            const response = await window.runner.runCode(codeFile);

            if (response?.usedBackend && response?.result) {
                logger.info("CodeManager", "Backend fallback result received:", response.result);
                this.onBackendResult?.(response.result);
            }
        } catch (err) {
            logger.error("CodeManager", "Error running code:", err);
            throw err;
        }
    }
}

export const codeManager = new CodeManager()
