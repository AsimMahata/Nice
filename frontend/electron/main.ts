import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path, { join } from 'path';
import { createNewFile, createNewFolder, getParentDirectory, isChildOf, openDirectory, readDirectory, readFileContent } from './Modules/FileSystem/FileActions';
import { showNotification } from './Modules/Notificaiton/Notification'
import { ptyRef } from './Modules/Terminal/terminal'
import { triggerAsyncId } from 'async_hooks';
import { exitCode } from 'process';


// main window
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

    // terminal
    ipcMain.handle("pty:create", (_e, options: termOpts) => {
        ptyRef.create(options);
        const pty = ptyRef.getPty()
        if (!pty) {
            console.error('PTY not created')
            return
        }
    });
    ipcMain.on("pty:write", (_event, data: string) => {
        ptyRef.write(data);
    });
    //resize
    ipcMain.on('pty:resize', (_e, cols, rows) => {
        ptyRef.resize(cols, rows)
    })
    ipcMain.on("pty:destroy", () => {
        ptyRef.destroy();
    });

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
        try {
            return await readDirectory(dirPath);
        } catch (err) {
            console.error('some error occured between main.ts and fileSystem modules,readDirectory', err)
        }
        return []
    });
    // IPC readFiles
    ipcMain.handle('read-file', (_event, path: string) => {
        return readFileContent(path);
    })
    // IPC open-folder-dialog 
    ipcMain.handle('open-folder-dialog', async () => {
        return openDirectory();
    });
    // IPC  is-child-of 
    ipcMain.handle('is-child-of', (_event, parent: string, child: string) => {
        return isChildOf(parent, child);
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
