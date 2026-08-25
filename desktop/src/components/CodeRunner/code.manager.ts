import { FileInfo } from "../../services/FileSystem/file.options";
import { CodeRunnerParams } from "./code.options";
import { logger } from "../../services/Logger/Logger";

declare global {
    interface Window {
        runner?: {
            runCode: (codeFile: FileInfo, input?: string) => Promise<{ usedBackend: boolean; result: any | null }>;
            probeCompiler: (language: string) => Promise<boolean>;
            runCodeBackend: (params: { filePath: string; language: string; code: string; input: string }) => Promise<any>;
        };
    }
}

class CodeManager {
    time = Date.now();
    activeRunningPath: string | null = null;
    onBackendResult: ((result: any, filePath: string) => void) | null = null;

    constructor() {
        logger.info("CodeManager", "CodeManager constructor initialized");
    }

    async runCode({ codeFile, codeLang, cwd, input }: CodeRunnerParams) {
        logger.info("CodeManager", "Run code invoked for", codeFile, codeLang, cwd, input);

        if (!window.runner) {
            logger.error("CodeManager", "window.runner is not defined");
            throw new Error("Code runner is not initialized");
        }
        if (!cwd) {
            logger.error("CodeManager", "Please open a Directory first to run code");
            throw new Error("Please open a folder first to run code");
        }

        const executingPath = codeFile.path;
        this.activeRunningPath = executingPath;

        try {
            const response = await window.runner.runCode(codeFile, input);

            if (response?.usedBackend && response?.result) {
                logger.info("CodeManager", "Backend fallback result received for", executingPath, response.result);
                this.onBackendResult?.(response.result, executingPath);
            }
            return response;
        } catch (err) {
            logger.error("CodeManager", "Error running code for", executingPath, err);
            throw err;
        } finally {
            if (this.activeRunningPath === executingPath) {
                this.activeRunningPath = null;
            }
        }
    }
}

export const codeManager = new CodeManager();
