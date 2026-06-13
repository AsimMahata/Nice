import * as pty from 'node-pty'
import { ShellType, TerminalOptions } from '../../types/terminal.types';


class PtyManager {
    private pty: pty.IPty | null = null;
    private pending: string[] = [];
    private shellType: ShellType | null = null;
    create(options: TerminalOptions) {
        if (this.pty) return;

        try {
            this.pty = pty.spawn(
                process.platform === 'win32' ? 'powershell.exe' : process.env.SHELL || '/bin/bash',
                [],
                options
            );
            this.shellType =
                process.platform === "win32"
                    ? "powershell"
                    : "bash";
            return;
        } catch (err) {
            console.error('error while creating terminal ??', err)
            this.destroy()
        }
    }

    getShellType() {
        return this.shellType;
    }

    async write(data: string) {
        if (!this.pty) return;
        console.log('data-in-backend-pty:', data)
        this.pty?.write(data);
    }

    resize(cols: number, rows: number) {
        this.pty?.resize(cols, rows)
    }
    getPty() {
        return this.pty
    }

    destroy() {
        if (!this.pty) return;
        this.pending = []
        console.log('pty in backend destroyed')
        this.pty.kill();
        this.pty = null;
    }
    async run(command: string) {
        if (!this.getPty()) {
            this.pending = [...this.pending, command]; //TODO:pending is never getting used
            return;
        }
        if (!command) {
            throw new Error('incomplete command , missing  command ')
        }
        await this.execute("clear")
        await this.execute(command)
    }

    private async execute(command: string) {
        await this.write(`${command}` + "\r");
    }
}

export const ptyManager = new PtyManager();
