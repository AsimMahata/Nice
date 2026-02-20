import { contextBridge, ipcRenderer } from 'electron';
import { isChildOf } from './Modules/FileSystem/FileActions';
import { TerminalOptions } from './types/terminal.types'
import { CodeRunnerParams } from './Modules/CodeRunner/CodeRunner';
// Expose APIs to renderer process if needed
contextBridge.exposeInMainWorld('electron', {
    // Add your electron APIs here
    // Example:
    // openFile: () => ipcRenderer.invoke('dialog:openFile'),
});

// notification service 
contextBridge.exposeInMainWorld('notify', {
    send: (title: string, body: string) => ipcRenderer.invoke('notify', title, body),
});




// CodeRunner services
contextBridge.exposeInMainWorld('runner', {
    runCode: ({ codeFile, codeLang, cwd }: CodeRunnerParams) => {
        console.log('invoke =================================')
        console.log('----------called run code for ', codeFile, codeLang, cwd);
        ipcRenderer.invoke('runner:run', { codeFile, codeLang, cwd })
    }
});

// File system APIs for directory reading
contextBridge.exposeInMainWorld('fileSystem', {
    readDirectory: (path: string) => ipcRenderer.invoke('read-directory', path),
    openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
    readFile: (path: string) => ipcRenderer.invoke('read-file', path),
    getParDir: (path: string) => ipcRenderer.invoke('get-par-dir', path),
    join: (...args: string[]) => ipcRenderer.invoke('join', ...args),
    createFolder: (path: string) => ipcRenderer.invoke('create-folder', path),
    createFile: (path: string) => ipcRenderer.invoke('create-file', path),
    isChildOf: (parent: string, child: string) =>
        ipcRenderer.invoke('is-child-of', parent, child),
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
