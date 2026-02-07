# Electron IPC Communication Guide

This guide explains how to add new functionality that communicates between your frontend (renderer) and the local machine (main process).

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     RENDERER (Frontend)                      │
│  React/Vite app - NO direct access to Node.js/filesystem    │
│                                                              │
│  window.yourAPI.someMethod()  ────────────────────────┐     │
└───────────────────────────────────────────────────────│─────┘
                                                        │
                                                        ▼
┌─────────────────────────────────────────────────────────────┐
│                      PRELOAD SCRIPT                          │
│  preload.ts → Bridge between renderer and main process      │
│                                                              │
│  contextBridge.exposeInMainWorld('yourAPI', {               │
│    someMethod: () => ipcRenderer.invoke('channel-name')     │
│  })                                                         │
└───────────────────────────────────────────────────────│─────┘
                                                        │
                                                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    MAIN PROCESS (Electron)                   │
│  main.ts → Full access to Node.js, filesystem, OS APIs     │
│                                                              │
│  ipcMain.handle('channel-name', async () => {               │
│    // Access filesystem, run commands, etc.                 │
│  })                                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step: Adding New Functionality

### Step 1: Create Your Module (Optional)

Create a new file in `electron/` for your logic. Example: `electron/myFeature.ts`

```typescript
// electron/myFeature.ts
import * as fs from 'fs';
import * as path from 'path';

export function myFunction(param: string): string {
  // Your logic here
  return `Result: ${param}`;
}
```

### Step 2: Add IPC Handler in main.ts

Import your module and add an IPC handler inside `app.whenReady()`:

```typescript
// In main.ts
import { myFunction } from './myFeature';

app.whenReady().then(() => {
  // Add your handler
  ipcMain.handle('my-channel-name', async (_event, param: string) => {
    return myFunction(param);
  });

  createWindow();
});
```

### Step 3: Expose API in preload.ts

Add your API to the `contextBridge`:

```typescript
// In preload.ts
contextBridge.exposeInMainWorld('myAPI', {
  myMethod: (param: string) => ipcRenderer.invoke('my-channel-name', param),
});
```

### Step 4: Use in Frontend (React)

```tsx
// In your React component
declare global {
  interface Window {
    myAPI: {
      myMethod: (param: string) => Promise<string>;
    };
  }
}

// Usage
const result = await window.myAPI.myMethod('hello');
```

---

## Build & Run

After making changes to electron files:

```bash
# Build electron TypeScript
npm run electron:build

# Fix CommonJS require paths (required after each build)
sed -i 's/require("\.\/yourModule")/require(".\/yourModule.cjs")/g' electron/dist/main.cjs

# Run in development
npm run electron:dev
```

> **Note**: Any new `.ts` file you add needs to be renamed to `.cjs` after compilation. Update the `electron:build` script in `package.json` to include your new file.

---

## Common IPC Patterns

### File System Operations

```typescript
// main.ts
ipcMain.handle('read-file', async (_event, filePath: string) => {
  return fs.readFileSync(filePath, 'utf-8');
});

ipcMain.handle('write-file', async (_event, filePath: string, content: string) => {
  fs.writeFileSync(filePath, content, 'utf-8');
  return true;
});

ipcMain.handle('delete-file', async (_event, filePath: string) => {
  fs.unlinkSync(filePath);
  return true;
});
```

### Open Native Dialogs

```typescript
// main.ts
import { dialog } from 'electron';

ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Text Files', extensions: ['txt', 'md'] }]
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('save-file-dialog', async () => {
  const result = await dialog.showSaveDialog({
    filters: [{ name: 'Text Files', extensions: ['txt'] }]
  });
  return result.canceled ? null : result.filePath;
});
```

### Run Shell Commands

```typescript
// main.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

ipcMain.handle('run-command', async (_event, command: string) => {
  try {
    const { stdout, stderr } = await execAsync(command);
    return { success: true, stdout, stderr };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

### System Information

```typescript
// main.ts
import * as os from 'os';

ipcMain.handle('get-system-info', async () => {
  return {
    platform: os.platform(),
    arch: os.arch(),
    hostname: os.hostname(),
    homedir: os.homedir(),
    cpus: os.cpus().length,
    memory: os.totalmem(),
  };
});
```

---

## Existing APIs

| API Name | Channel | Description |
|----------|---------|-------------|
| `fileSystem.readDirectory` | `read-directory` | Read directory contents |
| `fileSystem.openFolderDialog` | `open-folder-dialog` | Open native folder picker |
| `fileSystem.readFile` | `read-file` | Read file contents |

---

## Security Notes

1. **Never expose raw `require` or `eval`** to the renderer
2. **Validate all input** from the renderer before processing
3. **Use allowlists** for file paths if possible
4. **contextIsolation: true** and **nodeIntegration: false** should always be set (already configured)

---

## Troubleshooting

### "API not available" in browser
- Did you rebuild? Run `npm run electron:build`
- Did you rename `.js` to `.cjs`? Check `electron/dist/`
- Is Vite running? The preload only works in Electron, not browser

### TypeScript errors after adding new file
- Add the new file to the rename chain in `package.json` `electron:build` script

### "Cannot find module" error
- Check that your import path matches the renamed `.cjs` file

---

## Advanced Patterns (Future Scaling)

### Local Database (SQLite)

```bash
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

```typescript
// electron/database.ts
import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

const dbPath = path.join(app.getPath('userData'), 'app.db');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE
  )
`);

export function getUsers() {
  return db.prepare('SELECT * FROM users').all();
}

export function addUser(name: string, email: string) {
  return db.prepare('INSERT INTO users (name, email) VALUES (?, ?)').run(name, email);
}
```

```typescript
// main.ts
ipcMain.handle('db:get-users', async () => getUsers());
ipcMain.handle('db:add-user', async (_e, name, email) => addUser(name, email));
```

---

### Network Requests (Bypass CORS)

```typescript
// main.ts - Make requests from main process to bypass CORS
import { net } from 'electron';

ipcMain.handle('fetch-api', async (_event, url: string, options?: RequestInit) => {
  const response = await net.fetch(url, options);
  const data = await response.json();
  return { status: response.status, data };
});
```

```typescript
// Alternative: Using node-fetch or axios
import axios from 'axios';

ipcMain.handle('api-request', async (_event, config) => {
  const response = await axios(config);
  return { status: response.status, data: response.data };
});
```

---

### Native Notifications

```typescript
// main.ts
import { Notification } from 'electron';

ipcMain.handle('show-notification', async (_event, title: string, body: string) => {
  new Notification({ title, body }).show();
  return true;
});
```

---

### System Tray

```typescript
// main.ts
import { Tray, Menu, nativeImage } from 'electron';

let tray: Tray | null = null;

app.whenReady().then(() => {
  const icon = nativeImage.createFromPath('path/to/icon.png');
  tray = new Tray(icon);
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open', click: () => mainWindow?.show() },
    { label: 'Quit', click: () => app.quit() }
  ]);
  
  tray.setContextMenu(contextMenu);
  tray.setToolTip('My App');
});
```

---

### Keyboard Shortcuts (Global)

```typescript
// main.ts
import { globalShortcut } from 'electron';

app.whenReady().then(() => {
  globalShortcut.register('CommandOrControl+Shift+X', () => {
    mainWindow?.webContents.send('shortcut-triggered', 'Ctrl+Shift+X');
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
```

```typescript
// preload.ts - Listen for shortcuts in renderer
contextBridge.exposeInMainWorld('shortcuts', {
  onTriggered: (callback: (shortcut: string) => void) => {
    ipcRenderer.on('shortcut-triggered', (_e, shortcut) => callback(shortcut));
  }
});
```

---

### Clipboard Access

```typescript
// main.ts
import { clipboard } from 'electron';

ipcMain.handle('clipboard:read', async () => clipboard.readText());
ipcMain.handle('clipboard:write', async (_e, text: string) => {
  clipboard.writeText(text);
  return true;
});
```

---

### Auto Updates

```bash
npm install electron-updater
```

```typescript
// main.ts
import { autoUpdater } from 'electron-updater';

app.whenReady().then(() => {
  autoUpdater.checkForUpdatesAndNotify();
});

autoUpdater.on('update-available', () => {
  mainWindow?.webContents.send('update-available');
});

autoUpdater.on('update-downloaded', () => {
  mainWindow?.webContents.send('update-downloaded');
});

ipcMain.handle('install-update', () => autoUpdater.quitAndInstall());
```

---

### Multi-Window Management

```typescript
// main.ts
const windows: Map<string, BrowserWindow> = new Map();

ipcMain.handle('open-window', async (_event, windowId: string, url: string) => {
  if (windows.has(windowId)) {
    windows.get(windowId)?.focus();
    return;
  }

  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
    }
  });

  win.loadURL(url);
  windows.set(windowId, win);

  win.on('closed', () => windows.delete(windowId));
});

ipcMain.handle('close-window', async (_event, windowId: string) => {
  windows.get(windowId)?.close();
});
```

---

### Hardware Access (USB, Serial, etc.)

```bash
npm install serialport
```

```typescript
// electron/serial.ts
import { SerialPort } from 'serialport';

export async function listPorts() {
  return await SerialPort.list();
}

export function openPort(path: string, baudRate: number) {
  return new SerialPort({ path, baudRate });
}
```

```typescript
// main.ts
ipcMain.handle('serial:list-ports', async () => listPorts());
```

---

### Secure Storage (Keychain/Keyring)

```bash
npm install keytar
```

```typescript
// main.ts
import * as keytar from 'keytar';

const SERVICE_NAME = 'MyApp';

ipcMain.handle('secure:set', async (_e, key: string, value: string) => {
  await keytar.setPassword(SERVICE_NAME, key, value);
});

ipcMain.handle('secure:get', async (_e, key: string) => {
  return await keytar.getPassword(SERVICE_NAME, key);
});

ipcMain.handle('secure:delete', async (_e, key: string) => {
  await keytar.deletePassword(SERVICE_NAME, key);
});
```

---

### Print / PDF Generation

```typescript
// main.ts
ipcMain.handle('print-to-pdf', async () => {
  const pdfPath = path.join(app.getPath('documents'), 'output.pdf');
  const data = await mainWindow?.webContents.printToPDF({});
  fs.writeFileSync(pdfPath, data);
  return pdfPath;
});

ipcMain.handle('print', async () => {
  mainWindow?.webContents.print();
});
```

---

### Screen Capture / Recording

```typescript
// main.ts
import { desktopCapturer } from 'electron';

ipcMain.handle('get-sources', async () => {
  const sources = await desktopCapturer.getSources({ 
    types: ['window', 'screen'],
    thumbnailSize: { width: 300, height: 200 }
  });
  return sources.map(s => ({
    id: s.id,
    name: s.name,
    thumbnail: s.thumbnail.toDataURL()
  }));
});
```

---

### Native File Drag & Drop

```typescript
// main.ts
ipcMain.on('start-drag', (event, filePath: string) => {
  event.sender.startDrag({
    file: filePath,
    icon: nativeImage.createFromPath('path/to/icon.png')
  });
});
```

---

### Protocol Handler (Deep Links)

```typescript
// main.ts
const PROTOCOL = 'myapp';

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient(PROTOCOL);
}

// Handle: myapp://some/path
app.on('open-url', (event, url) => {
  event.preventDefault();
  mainWindow?.webContents.send('deep-link', url);
});
```

---

## Quick Reference Table

| Feature | Package | Electron API |
|---------|---------|--------------|
| Database | `better-sqlite3` | - |
| HTTP Requests | - | `net.fetch` |
| Notifications | - | `Notification` |
| System Tray | - | `Tray`, `Menu` |
| Shortcuts | - | `globalShortcut` |
| Clipboard | - | `clipboard` |
| Auto Updates | `electron-updater` | - |
| Serial/USB | `serialport` | - |
| Secure Storage | `keytar` | - |
| PDF | - | `webContents.printToPDF` |
| Screen Capture | - | `desktopCapturer` |
| Deep Links | - | `setAsDefaultProtocolClient` |

---

## Best Practices

### 1. Project Structure

```
electron/
├── main.ts           # Main process entry
├── preload.ts        # Context bridge (keep minimal)
├── modules/          # Feature modules
│   ├── fileSystem.ts
│   ├── database.ts
│   └── network.ts
├── utils/            # Shared utilities
│   └── validators.ts
└── types/            # TypeScript types
    └── ipc.ts
```

### 2. Type-Safe IPC Channels

```typescript
// electron/types/ipc.ts
export interface IPCChannels {
  'read-file': { args: [string]; return: string };
  'write-file': { args: [string, string]; return: boolean };
  'get-user': { args: [number]; return: User | null };
}

// Use these types in preload and main for consistency
```

### 3. Error Handling

```typescript
// main.ts - Always wrap handlers in try-catch
ipcMain.handle('risky-operation', async (_e, path: string) => {
  try {
    const result = await riskyOperation(path);
    return { success: true, data: result };
  } catch (error) {
    console.error('Operation failed:', error);
    return { success: false, error: (error as Error).message };
  }
});
```

```tsx
// Frontend - Always handle errors
const handleClick = async () => {
  const result = await window.myAPI.riskyOperation(path);
  if (!result.success) {
    showError(result.error);
    return;
  }
  // Use result.data
};
```

### 4. Input Validation

```typescript
// main.ts - Validate all renderer inputs
import path from 'path';

const ALLOWED_DIRS = ['/home/user/documents', '/home/user/downloads'];

ipcMain.handle('read-file', async (_e, filePath: string) => {
  // Normalize and validate path
  const normalized = path.normalize(filePath);
  
  // Check against allowlist
  const isAllowed = ALLOWED_DIRS.some(dir => normalized.startsWith(dir));
  if (!isAllowed) {
    throw new Error('Access denied: path not in allowed directories');
  }
  
  // Prevent path traversal
  if (normalized.includes('..')) {
    throw new Error('Invalid path');
  }
  
  return fs.readFileSync(normalized, 'utf-8');
});
```

### 5. Async Operations

```typescript
// ❌ Bad - Blocking the main process
ipcMain.handle('read-large-file', (_e, path) => {
  return fs.readFileSync(path); // Blocks!
});

// ✅ Good - Non-blocking
ipcMain.handle('read-large-file', async (_e, path) => {
  return await fs.promises.readFile(path, 'utf-8');
});
```

### 6. Memory Management

```typescript
// Clean up listeners when window closes
mainWindow.on('closed', () => {
  ipcMain.removeHandler('my-channel');
  mainWindow = null;
});

// Remove event listeners in renderer
useEffect(() => {
  const handler = (data) => setData(data);
  window.myAPI.onUpdate(handler);
  
  return () => {
    window.myAPI.removeUpdateListener(handler);
  };
}, []);
```

### 7. Logging

```typescript
// Use structured logging
import log from 'electron-log';

log.transports.file.level = 'info';
log.transports.console.level = 'debug';

ipcMain.handle('some-action', async (_e, data) => {
  log.info('Action triggered', { data });
  try {
    const result = await doSomething(data);
    log.debug('Action completed', { result });
    return result;
  } catch (error) {
    log.error('Action failed', { error, data });
    throw error;
  }
});
```

### 8. Environment-Specific Code

```typescript
// main.ts
const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
  win.webContents.openDevTools();
  // Enable hot reload, etc.
}

// Use different paths for dev/prod
const dbPath = isDev 
  ? path.join(__dirname, '../dev.db')
  : path.join(app.getPath('userData'), 'app.db');
```

### 9. Graceful Shutdown

```typescript
// main.ts
app.on('before-quit', async () => {
  // Save state
  await saveAppState();
  
  // Close database connections
  db.close();
  
  // Clean up temp files
  await cleanupTempFiles();
});
```

### 10. Testing

```typescript
// Separate business logic from IPC handlers for testability

// electron/modules/fileOps.ts (testable)
export function processFile(content: string): ProcessedData {
  // Pure logic, easy to test
  return parse(content);
}

// electron/main.ts (thin wrapper)
ipcMain.handle('process-file', async (_e, path) => {
  const content = await fs.promises.readFile(path, 'utf-8');
  return processFile(content); // Call testable function
});
```

### 11. Preload Script Best Practices

```typescript
// preload.ts - Keep it minimal!

// ❌ Bad - Logic in preload
contextBridge.exposeInMainWorld('api', {
  processData: (data) => {
    // Don't put logic here!
    return data.map(x => x * 2);
  }
});

// ✅ Good - Just forward to main
contextBridge.exposeInMainWorld('api', {
  processData: (data) => ipcRenderer.invoke('process-data', data)
});
```

### 12. Rate Limiting

```typescript
// Prevent abuse from renderer
const rateLimiter = new Map<string, number>();

ipcMain.handle('expensive-operation', async (_e, data) => {
  const now = Date.now();
  const lastCall = rateLimiter.get('expensive') || 0;
  
  if (now - lastCall < 1000) { // 1 second cooldown
    throw new Error('Rate limited. Try again later.');
  }
  
  rateLimiter.set('expensive', now);
  return await expensiveOperation(data);
});
```

### 13. Chunked File Operations

```typescript
// For large files, use streams
ipcMain.handle('read-large-file', async (_e, filePath) => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString()));
    stream.on('error', reject);
  });
});
```

### 14. Configuration Management

```typescript
// electron/config.ts
import Store from 'electron-store';

const store = new Store({
  defaults: {
    theme: 'dark',
    language: 'en',
    recentFiles: []
  }
});

export const getConfig = (key: string) => store.get(key);
export const setConfig = (key: string, value: any) => store.set(key, value);

// main.ts
ipcMain.handle('config:get', (_e, key) => getConfig(key));
ipcMain.handle('config:set', (_e, key, value) => setConfig(key, value));
```

### 15. Production Checklist

- [ ] Remove all `console.log` statements (use proper logging)
- [ ] Disable DevTools in production
- [ ] Enable code signing for your platform
- [ ] Set up auto-updates
- [ ] Add crash reporting (e.g., Sentry)
- [ ] Minify and bundle your code
- [ ] Test on all target platforms
- [ ] Validate all user inputs
- [ ] Handle offline scenarios gracefully
- [ ] Set proper Content Security Policy
- [ ] Remove unused dependencies
