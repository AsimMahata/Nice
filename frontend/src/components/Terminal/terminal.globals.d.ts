import { TerminalOptions } from "./terminal.types";

declare global {
    interface Window {
        pty?: {
            create: (options: TerminalOptions) => Promise<void>
            write: (data: string) => Promise<void>
            destroy: () => Promise<void>
            onData: (callback: (data: string) => void) => () => void
            resize: (cols: number, rows: number) => void
            onExit: (callback: () => void) => () => void
        };
    }
}

export { }
