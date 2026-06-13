

export type ShellType =
    | "powershell" // Windows PowerShell 5.1
    | "pwsh"       // PowerShell 7+
    | "cmd"
    | "bash";

// backend PTY options 
export type TerminalOptions = {
    cwd: string,
    cols: number,
    rows: number,
    name: string
}
