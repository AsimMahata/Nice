import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path, { join } from 'path';
import { createNewFile, createNewFolder, FileInfo, getParentDirectory, isChildOf, openDirectory, readDirectory, readFileContent, writeFileContent } from './Modules/FileSystem/FileActions';
import { showNotification } from './Modules/Notificaiton/Notification'
import { runCode } from './Modules/CodeRunner/CodeRunner'
import * as pty from 'node-pty'
import { TerminalOptions } from './types/terminal.types';
import { setupLSPWebSocket } from "./Modules/WebSocket/ws.lsp"
import { ptyManager } from "./Modules/Terminal/terminal"
import { setupCPHServer } from './Modules/CPH/cph';
import { settingsManager } from './Modules/Settings/SettingsManager';
import { snippetManager } from './Modules/Snippets/SnippetManager';
import { compileCPH, runTestcaseCPH } from './Modules/CPH/cphJudge';
let mainWindow: BrowserWindow | null = null;

import { scanDirectory } from "./Modules/SearchEngine/SearchEngine"


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

    // Force external links to open in the default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http:') || url.startsWith('https:')) {
            require('electron').shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });


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
    ptyManager.create(options);
    ptyProcess = ptyManager.getPty();
    ptyProcess?.onData((data: string) => {
        if (mainWindow) {
            mainWindow.webContents.send('terminal:data', data);
        }
    });

    ptyProcess?.onExit(() => {
        if (mainWindow) {
            mainWindow.webContents.send('terminal:exit');
        }
    });
}

app.whenReady().then(() => {
    createWindow();
    setupLSPWebSocket()

    setupCPHServer(() => mainWindow);

    // code runner
    ipcMain.handle('runner:run', async (_event, codeFile: FileInfo) => {
        await runCode(codeFile)
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
        if (ptyManager.getPty()) {
            ptyManager.write(data);
        }
    });

    ipcMain.on('terminal:resize', (_event, cols: number, rows: number) => {
        if (ptyManager.getPty()) {
            try {
                ptyManager.resize(cols, rows);
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
        if (ptyManager.getPty()) {
            ptyManager.destroy()
        }
    })

    // notification service 
    ipcMain.handle('notify', (_event, title: string, body: string) => {
        showNotification(title, body)

    });
    // SearchEngine service 
    ipcMain.handle('scanDirectory', (_event, path: string) => {
        return scanDirectory(path)
    });

    // auth window
    ipcMain.handle('auth:open-window', async (_event, providerUrl: string) => {
        return new Promise((resolve) => {
            const server = require('http').createServer((req: any, res: any) => {
                const url = new URL(req.url, `http://${req.headers.host}`);
                if (url.pathname === '/callback') {
                    const token = url.searchParams.get('token');
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end('<html><body><h2>Authentication successful! You can close this window now.</h2><script>window.close();</script></body></html>');
                    server.close();
                    if (token) {
                        resolve({ success: true, token });
                    } else {
                        resolve({ success: false, error: 'auth_failed' });
                    }
                }
            });

            server.listen(0, '127.0.0.1', () => {
                const port = server.address().port;

                // providerUrl is like http://localhost:3000/api/auth/desktop/google
                const authUrl = `${providerUrl}?port=${port}`;
                require('electron').shell.openExternal(authUrl);
            });

            server.on('error', (err: any) => {
                console.error('Local auth server error:', err);
                resolve({ success: false, error: err.message });
            });
        });
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
    // IPC writeFileContent
    ipcMain.handle('write-file-content', (_event, path: string, content: string) => {
        return writeFileContent(path, content);
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

    // IPC for Settings
    ipcMain.handle('get-settings', () => {
        return settingsManager.getSettings();
    });

    ipcMain.handle('save-settings', (_event, settings: any) => {
        return settingsManager.saveSettings(settings);
    });

    // IPC for Snippets
    ipcMain.handle('get-snippets-raw', (_event, language: string) => {
        return snippetManager.getSnippetsRaw(language);
    });

    ipcMain.handle('save-snippets-raw', (_event, language: string, rawJson: string) => {
        return snippetManager.saveSnippetsRaw(language, rawJson);
    });

    ipcMain.handle('get-snippets-parsed', (_event, language: string) => {
        return snippetManager.getSnippetsParsed(language);
    });

    ipcMain.handle('cph:compile', async (_event, filePath: string) => {
        return await compileCPH(filePath);
    });

    ipcMain.handle('cph:run-testcase', async (_event, { binaryPath, input, timeLimit }) => {
        return await runTestcaseCPH(binaryPath, input, timeLimit);
    });


});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
