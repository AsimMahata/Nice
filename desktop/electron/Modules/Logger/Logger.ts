import fs from 'fs';
import path from 'path';
import os from 'os';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export class Logger {
    private static instance: Logger;
    private logDir: string;
    private readonly MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB limit
    private readonly MAX_BACKUP_FILES = 5;

    private constructor() {
        // Target log path: AppData\Local\com.nice.desktop\logs
        const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
        this.logDir = path.join(localAppData, 'com.nice.desktop', 'logs');

        this.ensureLogDir();
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private ensureLogDir(): void {
        try {
            if (!fs.existsSync(this.logDir)) {
                fs.mkdirSync(this.logDir, { recursive: true });
            }
        } catch (err) {
            console.error('Failed to create log directory:', err);
        }
    }

    public getLogDir(): string {
        return this.logDir;
    }

    public getLogFilePath(backupIndex: number = 0): string {
        if (backupIndex === 0) {
            return path.join(this.logDir, 'nice.log');
        }
        return path.join(this.logDir, `nice.${backupIndex}.log`);
    }

    private rotateLogsIfNeeded(incomingLength: number): void {
        const currentFile = this.getLogFilePath(0);
        if (!fs.existsSync(currentFile)) return;

        try {
            const stats = fs.statSync(currentFile);
            if (stats.size + incomingLength >= this.MAX_LOG_SIZE) {
                // Delete oldest backup file if it exists
                const oldestFile = this.getLogFilePath(this.MAX_BACKUP_FILES);
                if (fs.existsSync(oldestFile)) {
                    fs.unlinkSync(oldestFile);
                }

                // Shift backup files (nice.4.log -> nice.5.log, ..., nice.1.log -> nice.2.log)
                for (let i = this.MAX_BACKUP_FILES - 1; i >= 1; i--) {
                    const src = this.getLogFilePath(i);
                    const dest = this.getLogFilePath(i + 1);
                    if (fs.existsSync(src)) {
                        fs.renameSync(src, dest);
                    }
                }

                // Rename active log file nice.log -> nice.1.log
                fs.renameSync(currentFile, this.getLogFilePath(1));
            }
        } catch (err) {
            console.error('Error during log rotation:', err);
        }
    }

    private formatTimestamp(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const millis = String(now.getMilliseconds()).padStart(3, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${millis}`;
    }

    public log(level: LogLevel, scope: string, message: string, ...details: any[]): void {
        this.ensureLogDir();

        const timestamp = this.formatTimestamp();
        const levelStr = level.toUpperCase().padEnd(5, ' ');
        const detailsStr = details && details.length > 0 
            ? ' ' + details.map(d => (typeof d === 'object' ? JSON.stringify(d) : String(d))).join(' ') 
            : '';

        const formattedLogLine = `[${timestamp}] [${levelStr}] [${scope}]: ${message}${detailsStr}\n`;

        // 1. Output to Console (Stdout / Stderr)
        const consolePrefix = `[${timestamp}] [${levelStr}] [${scope}]:`;
        switch (level) {
            case 'error':
                console.error(consolePrefix, message, ...details);
                break;
            case 'warn':
                console.warn(consolePrefix, message, ...details);
                break;
            case 'debug':
                console.debug(consolePrefix, message, ...details);
                break;
            default:
                console.log(consolePrefix, message, ...details);
                break;
        }

        // 2. Rotate log files if 5MB limit will be exceeded, then append to file
        try {
            const lineBuffer = Buffer.from(formattedLogLine, 'utf8');
            this.rotateLogsIfNeeded(lineBuffer.length);
            const filePath = this.getLogFilePath(0);
            fs.appendFileSync(filePath, lineBuffer);
        } catch (err) {
            console.error('Failed to write to log file:', err);
        }
    }

    public info(scope: string, message: string, ...details: any[]): void {
        this.log('info', scope, message, ...details);
    }

    public warn(scope: string, message: string, ...details: any[]): void {
        this.log('warn', scope, message, ...details);
    }

    public error(scope: string, message: string, ...details: any[]): void {
        this.log('error', scope, message, ...details);
    }

    public debug(scope: string, message: string, ...details: any[]): void {
        this.log('debug', scope, message, ...details);
    }

    public readLogs(backupIndex: number = 0): string {
        try {
            const filePath = this.getLogFilePath(backupIndex);
            if (fs.existsSync(filePath)) {
                return fs.readFileSync(filePath, 'utf8');
            }
            return '';
        } catch (err) {
            console.error('Failed to read log file:', err);
            return '';
        }
    }
}

export const logger = Logger.getInstance();
