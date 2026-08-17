import { contextBridge, ipcRenderer } from 'electron';
import { TerminalOptions } from './types/terminal.types'
import { FileInfo, getFileInfo } from './Modules/FileSystem/FileActions';
// Expose APIs to renderer process if needed
contextBridge.exposeInMainWorld('electron', {
    // Add your electron APIs here
    // Example:
    // openFile: () => ipcRenderer.invoke('dialog:openFile'),
});

contextBridge.exposeInMainWorld('logger', {
    info: (scope: string, message: string, ...details: any[]) =>
        ipcRenderer.invoke('logger:log', { level: 'info', scope, message, details }),
    warn: (scope: string, message: string, ...details: any[]) =>
        ipcRenderer.invoke('logger:log', { level: 'warn', scope, message, details }),
    error: (scope: string, message: string, ...details: any[]) =>
        ipcRenderer.invoke('logger:log', { level: 'error', scope, message, details }),
    debug: (scope: string, message: string, ...details: any[]) =>
        ipcRenderer.invoke('logger:log', { level: 'debug', scope, message, details }),
    getLogDir: () => ipcRenderer.invoke('logger:get-log-dir'),
    getLogPath: (backupIndex?: number) => ipcRenderer.invoke('logger:get-log-path', backupIndex),
    readLogs: (backupIndex?: number) => ipcRenderer.invoke('logger:read-logs', backupIndex),
});

contextBridge.exposeInMainWorld('settings', {
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
});

contextBridge.exposeInMainWorld('snippets', {
    getSnippetsRaw: (language: string) => ipcRenderer.invoke('get-snippets-raw', language),
    saveSnippetsRaw: (language: string, rawJson: string) => ipcRenderer.invoke('save-snippets-raw', language, rawJson),
    getSnippetsParsed: (language: string) => ipcRenderer.invoke('get-snippets-parsed', language),
});

// notification service 
contextBridge.exposeInMainWorld('notify', {
    send: (title: string, body: string) => ipcRenderer.invoke('notify', title, body),
});

// auth popup window
contextBridge.exposeInMainWorld('auth', {
    openAuthWindow: (url: string) => ipcRenderer.invoke('auth:open-window', url)
});

// SearchEngine service 
contextBridge.exposeInMainWorld('search', {
    scanDirectory: (path: string) => ipcRenderer.invoke('scanDirectory', path),
});

// CP helper
contextBridge.exposeInMainWorld('cph', {
    onProblem: (callback: (data: any) => void) => {
        const listener = (_e: Electron.IpcRendererEvent, data: any) => {
            callback(data);
        };
        ipcRenderer.on('cph:problem', listener);

        // Return an unsubscribe/cleanup function
        return () => {
            ipcRenderer.removeListener('cph:problem', listener);
        };
    },
    // compile: pass both filePath and language so ExecutionService can probe locally or fall back
    compile: (filePath: string, language?: string) => {
        const extToLang: Record<string, string> = {
            '.cpp': 'cpp', '.cc': 'cpp', '.cxx': 'cpp',
            '.c': 'c', '.py': 'python', '.java': 'java',
        };
        const ext = filePath.slice(filePath.lastIndexOf('.')).toLowerCase();
        const lang = language || extToLang[ext] || 'cpp';
        return ipcRenderer.invoke('cph:compile', { filePath, language: lang });
    },
    // runTestcase: pass language and code for backend fallback mode
    runTestcase: (binaryPath: string, input: string, timeLimit: number, language?: string, code?: string) =>
        ipcRenderer.invoke('cph:run-testcase', { binaryPath, input, timeLimit, language, code })
});



// CodeRunner services
contextBridge.exposeInMainWorld('runner', {
    // Primary run: opens terminal if local, returns { usedBackend, result } if backend
    runCode: (codeFile: FileInfo): Promise<{ usedBackend: boolean; result: any | null }> => {
        console.log('invoke runner:run =================================')
        console.log('----------called run code for ', codeFile);
        return ipcRenderer.invoke('runner:run', codeFile)
    },
    // Check if local compiler is available
    probeCompiler: (language: string): Promise<boolean> => {
        return ipcRenderer.invoke('runner:probe-compiler', language);
    },
    // Structured backend run — always returns ExecutionResult
    runCodeBackend: (params: { filePath: string; language: string; code: string; input: string }) => {
        return ipcRenderer.invoke('runner:run-backend', params);
    },
});

// File system APIs for directory reading
contextBridge.exposeInMainWorld('fileSystem', {
    // general
    join: (...args: string[]) => ipcRenderer.invoke('join', ...args),
    isChildOf: (parent: string, child: string) => ipcRenderer.invoke('is-child-of', parent, child),
    openFolderSelector: () => ipcRenderer.invoke('open-folder-dialog'),
    getParDir: (path: string) => ipcRenderer.invoke('get-par-dir', path),
    // file
    createFile: (path: string) => ipcRenderer.invoke('create-file', path),
    readFile: (path: string) => ipcRenderer.invoke('read-file', path),
    writeFileContent: (path: string, content: string) => ipcRenderer.invoke('write-file-content', path, content),
    getFileInfo: (path: string) => ipcRenderer.invoke('get-file-info', path),
    // directory
    createDirectory: (path: string) => ipcRenderer.invoke('create-folder', path),
    readDirectory: (path: string) => ipcRenderer.invoke('read-directory', path),
});



// Terminal

contextBridge.exposeInMainWorld("pty", {
    create: (options: TerminalOptions) => {
        ipcRenderer.send('terminal:create', options)
    },

    write: (data: string) => {
        console.log('is it calling backend write ---------------')
        ipcRenderer.send("terminal:write", data)
    },
    destroy: () => ipcRenderer.send("terminal:destroy"),
    onData: (callback: (data: string) => void) => {
        const listener = (_e: Electron.IpcRendererEvent, data: string) => {
            callback(data)
        }

        ipcRenderer.on("terminal:data", listener)

        return () => {
            ipcRenderer.removeListener("terminal:data", listener)
        }
    },
    resize: (cols: number, rows: number) =>
        ipcRenderer.send('terminal:resize', cols, rows),
    onExit: (callback: () => void) => {
        ipcRenderer.on('terminal:exit', () => callback());
    },
});
