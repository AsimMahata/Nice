import { Terminal } from "@xterm/xterm"
import { xtermOptions } from "./terminal.options"
import { useContext } from "react"


class TerminalManager {
    private terminal: Terminal | null = null
    private isConnected = false
    async create() {
        console.log('terminal created')
    }
    async mount(container: HTMLDivElement) {
        console.log('created------------------')
        this.terminal = new Terminal(xtermOptions)
        this.terminal.open(container)
        this.attachXtermInput()
        await this.connectWithBackend()
    }
    async unmount() {
        console.log('ran it ------------------------')
        try {
            await this.disconnectBackend()
        } catch (err) {
            console.error('some error occured while disconnecting backend terminal', err)
        }
        this.terminal?.dispose()
        this.terminal = null;
    }
    private async write(data: string) {
        await window.pty?.write(data)
    }
    private async resize(cols: number, rows: number) {
        window.pty?.resize(cols, rows)
    }

    private async disconnectBackend() {
        await window.pty?.destroy()
        this.isConnected = false
    }

    private async connectWithBackend() {
        if (!this.terminal) return;
        window.pty?.create()

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
