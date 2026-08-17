import { ITerminalOptions } from "@xterm/xterm"

export interface Tab {
    id: string;
    name: string;
    active: boolean;
}
export type TerminalOptions = {
    cwd?: string,
    cols: number,
    rows: number,
    name: string
}

export const terminalTheme = {
    background: '#1e1e1e',
    foreground: '#cccccc',
    cursor: '#ffffff',
    cursorAccent: '#000000',
    selectionBackground: '#264f78',
    black: '#000000',
    red: '#cd3131',
    green: '#0dbc79',
    yellow: '#e5e510',
    blue: '#2472c8',
    magenta: '#bc3fbc',
    cyan: '#11a8cd',
    white: '#e5e5e5',
    brightBlack: '#666666',
    brightRed: '#f14c4c',
    brightGreen: '#23d18b',
    brightYellow: '#f5f543',
    brightBlue: '#3b8eea',
    brightMagenta: '#d670d6',
    brightCyan: '#29b8db',
    brightWhite: '#ffffff',
}

// terminal.constants.ts

export const terminalFontFamily =
    '"Cascadia Code","AnonymicePro Nerd Font","Fira Code",Consolas,"Courier New",monospace'



export const xtermOptions: ITerminalOptions = {
    theme: terminalTheme,
    fontFamily: terminalFontFamily,
    fontSize: 13,
    lineHeight: 1.2,
    letterSpacing: 0,
    cursorBlink: true,
    cursorStyle: 'block',
    scrollback: 10000,
    allowProposedApi: true
}
