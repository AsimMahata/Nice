import * as pty from 'node-pty'
import { TerminalOptions } from '../../types/terminal.types';
import { RunCommand } from '../CodeRunner/CodeRunner';

class PtyManager {
    private pty: pty.IPty | null = null;
    private pending: RunCommand | null = null;  //TODO: make use of this pending thing cause its still unused
    create(options: TerminalOptions) {
        if (this.pty) return;

        try {
            this.pty = pty.spawn(
                process.platform === 'win32' ? 'powershell.exe' : process.env.SHELL || '/bin/bash',
                [],
                options
            );
            return;
        } catch (err) {
            console.error('error while creating terminal ??', err)
            this.destroy()
        }
        //        this.pty?.onData((data) => {
        //            console.log('are we inside pty.onData please speed i need this ')
        //            const win = BrowserWindow.getAllWindows()[0]
        //            if (!win || win.isDestroyed()) return
        //            win.webContents.send('pty:data', data)
        //        })
        //        this.pty?.onExit(() => {
        //            this.destroy();
        //        });
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
        console.log('pty in backend destroyed')
        this.pty.kill();
        this.pty = null;
    }
    async run(command: RunCommand) {
        if (!ptyManager.getPty()) {
            this.pending = command;
            return;
        }
        // clear the terminal first 
        this.execute("clear")

        // running all commands
        if (!command.cdTopath) {
            throw new Error('incomplete run command')
        }
        await this.execute(command.cdTopath);

        if (!command.compileCommand) {
            throw new Error('incomplete run command,compile first')
        }
        await this.execute(command.compileCommand)
        if (!command.runCommand) {
            throw new Error('incomplete run command , missing run command ')
        }
        await this.execute(command.runCommand)
    }

    private async execute(command: string) {
        await this.write(`${command}` + "\r");
    }
}

export const ptyManager = new PtyManager();
