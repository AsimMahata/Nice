export const logger = {
    info: (scope: string, message: string, ...details: any[]) => {
        console.log(`[INFO ] [${scope}]: ${message}`, ...details);
        if (window.logger) {
            void window.logger.info(scope, message, ...details);
        }
    },
    warn: (scope: string, message: string, ...details: any[]) => {
        console.warn(`[WARN ] [${scope}]: ${message}`, ...details);
        if (window.logger) {
            void window.logger.warn(scope, message, ...details);
        }
    },
    error: (scope: string, message: string, ...details: any[]) => {
        console.error(`[ERROR] [${scope}]: ${message}`, ...details);
        if (window.logger) {
            void window.logger.error(scope, message, ...details);
        }
    },
    debug: (scope: string, message: string, ...details: any[]) => {
        console.debug(`[DEBUG] [${scope}]: ${message}`, ...details);
        if (window.logger) {
            void window.logger.debug(scope, message, ...details);
        }
    },
    getLogDir: async (): Promise<string> => {
        if (window.logger) {
            return window.logger.getLogDir();
        }
        return '';
    },
    getLogPath: async (backupIndex?: number): Promise<string> => {
        if (window.logger) {
            return window.logger.getLogPath(backupIndex);
        }
        return '';
    },
    readLogs: async (backupIndex?: number): Promise<string> => {
        if (window.logger) {
            return window.logger.readLogs(backupIndex);
        }
        return '';
    }
};
