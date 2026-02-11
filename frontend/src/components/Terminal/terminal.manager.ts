import { Terminal } from "@xterm/xterm"
import { TerminalOptions, xtermOptions } from "./terminal.options"
import { FitAddon } from "@xterm/addon-fit";

class TerminalManager {
    private terminal: Terminal | null = null;
    private isConnected = false;
    private fitAddon: FitAddon | null = null;
    private onDataCallBack: (() => void) | undefined = undefined;
    private onExitCallBack: (() => void) | undefined = undefined;
    private resizeObserver: ResizeObserver | null = null

    private handleResize = () => {
        if (this.fitAddon && this.terminal) {
            this.fitAddon.fit()
            const dims = this.fitAddon.proposeDimensions();
            if (dims) {
                window.pty?.resize(dims.cols, dims.rows);
                this.terminal.resize(dims.cols, dims.rows)
            }
        }
    };

    async create() {
        console.log('terminal created')
    }

    async mount(container: HTMLDivElement, cwd: string) {
        if (!cwd) {
            console.error('please open a working directory first')
            return;
        }

        if (this.terminal || this.isConnected) {
            return;
        }

        this.terminal = new Terminal(xtermOptions)
        this.fitAddon = new FitAddon()

        this.terminal.open(container)
        this.terminal.loadAddon(this.fitAddon)

        this.attachXtermInput()
        await this.connectWithBackend(cwd)

        this.resizeObserver = new ResizeObserver(() => {
            this.handleResize()
        })

        this.resizeObserver.observe(container)

        console.log("MOUNT")
    }

    async unmount() {
        try {
            await this.disconnectBackend()
        } catch (err) {
            console.error('error while disconnecting backend terminal', err)
        }

        this.resizeObserver?.disconnect()
        this.resizeObserver = null

        this.terminal?.dispose()
        this.terminal = null

        this.fitAddon?.dispose()
        this.fitAddon = null

        this.onDataCallBack = undefined
        this.onExitCallBack = undefined

        this.isConnected = false

        console.log("UNMOUNT")
    }

    private async disconnectBackend() {
        if (!this.isConnected) return

        this.onDataCallBack?.()
        this.onExitCallBack?.()

        this.onDataCallBack = undefined
        this.onExitCallBack = undefined

        try {
            await window.pty?.destroy()
        } catch (err) {
            console.error('error when disconnecting backend terminal', err)
        }

        this.isConnected = false
    }

    private async connectWithBackend(cwd: string) {
        if (!this.terminal) return;

        const termOpts: TerminalOptions = {
            cwd: cwd,
            rows: this.terminal.rows,
            cols: this.terminal.cols,
            name: "xterm-256color",
        }

        try {
            await window.pty?.create(termOpts)
            this.isConnected = true;

            this.onDataCallBack = window.pty?.onData((data) => {
                if (!this.terminal) return;
                this.terminal.write(data)
            })

            this.onExitCallBack = window.pty?.onExit(() => {
                if (!this.terminal) return;
                this.terminal.writeln('\r\n\x1b[90m[Process completed]\x1b[0m');
            })

        } catch (err) {
            console.error('error while creating terminal on backend', err)
        }
    }

    private async sendInputToBackend(data: string) {
        await window.pty?.write(data)
    }

    private attachXtermInput() {
        if (!this.terminal) return;

        this.terminal.onData((data) => {
            this.sendInputToBackend(data)
        })
    }
}

export const terminalManager = new TerminalManager()
