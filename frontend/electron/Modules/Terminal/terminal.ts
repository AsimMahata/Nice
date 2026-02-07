import { BrowserWindow } from 'electron';
import * as pty from 'node-pty'

declare global {
    type termOpts = {
        cwd: string,
        cols: number,
        rows: number,
        name: string
    }
}
class PtyManager {
    private pty: pty.IPty | null = null;

    create(options: termOpts) {
        if (this.pty) return;

        this.pty = pty.spawn(
            process.platform === "win32" ? "powershell.exe" : "bash",
            [],
            options
        );

        this.pty.onData((data) => {
            const win = BrowserWindow.getAllWindows()[0]
            if (!win || win.isDestroyed()) return
            win.webContents.send('pty:data', data)
        })
        this.pty.onExit(() => {
            this.destroy();
        });
    }

    write(data: string) {
        if (!this.pty) return;
        console.log('data-in-backend-pty:', data)
        this.pty.write(data);
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
}

export const ptyRef = new PtyManager();
