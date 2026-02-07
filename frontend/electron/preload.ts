import { contextBridge, ipcRenderer } from 'electron';

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
    createFile: (path: string) => ipcRenderer.invoke('create-file', path)
});
