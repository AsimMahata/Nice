import { contextBridge, ipcRenderer } from 'electron';
import { TerminalOptions } from './types/terminal.types'
import { FileInfo } from './Modules/FileSystem/FileActions';
// Expose APIs to renderer process if needed
contextBridge.exposeInMainWorld('electron', {
    // Add your electron APIs here
    // Example:
    // openFile: () => ipcRenderer.invoke('dialog:openFile'),
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
    }
});



// CodeRunner services
contextBridge.exposeInMainWorld('runner', {
    runCode: (codeFile: FileInfo) => {
        console.log('invoke =================================')
        console.log('----------called run code for ', codeFile);
        ipcRenderer.invoke('runner:run', codeFile)
    }
});

// File system APIs for directory reading
contextBridge.exposeInMainWorld('fileSystem', {
    readDirectory: (path: string) => ipcRenderer.invoke('read-directory', path),
    openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
    readFile: (path: string) => ipcRenderer.invoke('read-file', path),
    writeFileContent: (path: string, content: string) => ipcRenderer.invoke('write-file-content', path, content),
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
