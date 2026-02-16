import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path, { join } from 'path';
import { createNewFile, createNewFolder, getParentDirectory, isChildOf, openDirectory, readDirectory, readFileContent } from './Modules/FileSystem/FileActions';
import { showNotification } from './Modules/Notificaiton/Notification'
import { runCode } from './Modules/CodeRunner/CodeRunner'
import * as pty from 'node-pty'
import { TerminalOptions } from './types/terminal.types';
import { setupLSPWebSocket } from "./Modules/WebSocket/ws.lsp"
let mainWindow: BrowserWindow | null = null;

let ptyProcess: pty.IPty | null = null;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// main window
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    // In development, load from Vite dev server
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        // In production, load from built files
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }


    // dispose all ptys
    mainWindow.on('closed', () => {
        mainWindow = null
        if (ptyProcess) {
            ptyProcess.kill();
            ptyProcess = null;
        }
    })
}

// PTY handling
function createPty(options: TerminalOptions) {
    if (!mainWindow) {
        console.error('mainWindow not found error 404', mainWindow)
        return;
    }
    const shell = process.platform === 'win32' ? 'powershell.exe' : process.env.SHELL || '/bin/bash';

    ptyProcess = pty.spawn(shell, [], options);
    console.log('created new pty in backend--------------------------')
    ptyProcess.onData((data: string) => {
        if (mainWindow) {
            console.log('is there any reply from the ptyProcess ------------------')
            console.log(data)
            mainWindow.webContents.send('terminal:data', data);
        }
    });

    ptyProcess.onExit(() => {
        if (mainWindow) {
            mainWindow.webContents.send('terminal:exit');
        }
    });
}

app.whenReady().then(() => {
    createWindow();
    setupLSPWebSocket()
    //code runner services handlers
    ipcMain.handle('runner:run', (_event, lang: string, filePath: string) => {
        return runCode(lang, filePath)
    })

    // // terminal create
    // ipcMain.handle("pty:create", (_e, options: termOpts) => {
    //     ptyRef.create(options);
    //     const pty = ptyRef.getPty()
    //     if (!pty) {
    //         console.error('PTY not created')
    //         return
    //     }
    // });
    //
    // ipcMain.on("pty:write", (_event, data: string) => {
    //     ptyRef.write(data);
    // });
    // //resize
    // ipcMain.on('pty:resize', (_e, cols, rows) => {
    //     ptyRef.resize(cols, rows)
    // })
    // ipcMain.on("pty:destroy", () => {
    //     ptyRef.destroy();
    // });

    ipcMain.on('terminal:write', (_event, data: string) => {
        if (ptyProcess) {
            console.log('is there any ptyProcess ------------')
            ptyProcess.write(data);
        }
    });

    ipcMain.on('terminal:resize', (_event, cols: number, rows: number) => {
        if (ptyProcess) {
            try {
                ptyProcess.resize(cols, rows);
            } catch (err) {
                console.error('error occured while resizing terminal i backend', err)
            }
        }
    });

    ipcMain.on('terminal:create', (_event, options: TerminalOptions) => {
        if (ptyProcess) {
            ptyProcess.kill();
        }
        createPty(options);
    });
    ipcMain.on('terminal:destroy', () => {
        if (ptyProcess) {
            ptyProcess.kill();
            ptyProcess = null;
            console.log('pty in backend destroyed-------------------------', ptyProcess)
        }
    })

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


});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
