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
    create: (cwd?: string) => ipcRenderer.invoke("pty:create", cwd),
    write: (data: string) => {
        ipcRenderer.send("pty:write", data)
    },
    destroy: () => ipcRenderer.send("pty:destroy"),
    onData: (cb: (data: string) => void) => {
        ipcRenderer.on("pty:data", (_e, data) => {
            cb(data)
        });
    },
    resize: (cols: number, rows: number) =>
        ipcRenderer.send('pty:resize', cols, rows),
});
