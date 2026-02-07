import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path, { join } from 'path';
import fs from "fs/promises";
import { createNewFile, createNewFolder, getParentDirectory, openDirectory, readDirectory, readFileContent } from './Modules/FileSystem/FileActions';
import { showNotification } from './Modules/Notificaiton/Notification'
import { bo } from 'react-router/dist/development/instrumentation-DvHY1sgY';

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    // In development, load from Vite dev server
    if (process.env.NODE_ENV === 'development') {
        win.loadURL('http://localhost:5173');
        win.webContents.openDevTools();
    } else {
        // In production, load from built files
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(() => {

    // notification service 
    ipcMain.handle('notify', (_event, title: string, body: string) => {
        showNotification(title, body)
    });

    // join paths 
    ipcMain.handle('join', (_event, ...args: string[]) => {
        return join(...args);
    })
    // get parent directory
    ipcMain.handle('get-par-dir', (_event, dirpath: string) => {
        return getParentDirectory(dirpath)
    })
    // create folder
    ipcMain.handle('create-folder', (_event, path: string) => {
        return createNewFolder(path)
    })
    // create file
    ipcMain.handle('create-file', (_event, path: string) => {
        return createNewFile(path)
    })
    // IPC handlers for file reading
    ipcMain.handle('read-directory', async (_event, dirPath: string) => {
        return readDirectory(dirPath);
    });
    // IPC readFiles
    ipcMain.handle('read-file', (_event, path: string) => {
        return readFileContent(path);
    })
    // IPC open-folder-dialog 
    ipcMain.handle('open-folder-dialog', async () => {
        return openDirectory();
    });

    ipcMain.handle('save-file-dialog', async () => {
        const result = await dialog.showSaveDialog({
            filters: [{ name: 'Text Files', extensions: ['txt'] }]
        });
        return result.canceled ? null : result.filePath;
    });


    createWindow()
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
