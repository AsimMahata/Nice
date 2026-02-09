import { contextBridge, ipcRenderer } from 'electron';
import { isChildOf } from './Modules/FileSystem/FileActions';

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
    runCode: (lang: string, filePath: string) => ipcRenderer.invoke('runner:run', lang, filePath)
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
    create: (options: termOpts) => {
        console.log('----------------------------------')
        ipcRenderer.send('terminal:create', options)
    },

    write: (data: string) => {
        ipcRenderer.send("terminal:write", data)
    },
    destroy: () => ipcRenderer.send("terminal:destroy"),
    onData: (callback: (data: string) => void) => {
        ipcRenderer.on("terminal:data", (_e, data) => {
            callback(data)
        });
    },
    resize: (cols: number, rows: number) =>
        ipcRenderer.send('terminal:resize', cols, rows),
    onExit: (callback: () => void) => {
        ipcRenderer.on('terminal:exit', () => callback());
    },
});
