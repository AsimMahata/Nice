declare global {
    interface Window {
        logger?: {
            info: (scope: string, message: string, ...details: any[]) => Promise<void>;
            warn: (scope: string, message: string, ...details: any[]) => Promise<void>;
            error: (scope: string, message: string, ...details: any[]) => Promise<void>;
            debug: (scope: string, message: string, ...details: any[]) => Promise<void>;
            getLogDir: () => Promise<string>;
            getLogPath: (backupIndex?: number) => Promise<string>;
            readLogs: (backupIndex?: number) => Promise<string>;
        };
    }
}

export { };
