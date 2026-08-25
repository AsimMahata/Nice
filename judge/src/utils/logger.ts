export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

class Logger {
    private formatTimestamp(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const ms = String(now.getMilliseconds()).padStart(3, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
    }

    private log(level: LogLevel, scope: string, message: string, ...meta: any[]): void {
        const timestamp = this.formatTimestamp();
        const formattedScope = scope ? `[${scope}]` : '[Judge]';
        const formattedLevel = `[${level}]`.padEnd(7, ' ');
        const output = `[${timestamp}] ${formattedLevel} ${formattedScope} ${message}`;

        if (level === 'ERROR') {
            if (meta.length > 0) {
                console.error(output, ...meta);
            } else {
                console.error(output);
            }
        } else if (level === 'WARN') {
            if (meta.length > 0) {
                console.warn(output, ...meta);
            } else {
                console.warn(output);
            }
        } else {
            if (meta.length > 0) {
                console.log(output, ...meta);
            } else {
                console.log(output);
            }
        }
    }

    info(scope: string, message: string, ...meta: any[]): void {
        this.log('INFO', scope, message, ...meta);
    }

    warn(scope: string, message: string, ...meta: any[]): void {
        this.log('WARN', scope, message, ...meta);
    }

    error(scope: string, message: string, ...meta: any[]): void {
        this.log('ERROR', scope, message, ...meta);
    }

    debug(scope: string, message: string, ...meta: any[]): void {
        this.log('DEBUG', scope, message, ...meta);
    }

    createScope(scope: string) {
        return {
            info: (message: string, ...meta: any[]) => this.info(scope, message, ...meta),
            warn: (message: string, ...meta: any[]) => this.warn(scope, message, ...meta),
            error: (message: string, ...meta: any[]) => this.error(scope, message, ...meta),
            debug: (message: string, ...meta: any[]) => this.debug(scope, message, ...meta),
        };
    }
}

export const logger = new Logger();
