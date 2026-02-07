/**
 * Example: Directory Reader for Electron
 * 
 * This file demonstrates how to read directory contents using Electron.
 * It uses Node.js fs module which is available in Electron's main process.
 */

import * as fs from 'fs';
import * as path from 'path';

// Interface for file/folder information
interface FileInfo {
    name: string;
    path: string;
    isDirectory: boolean;
    size: number;
    modifiedAt: Date;
    extension: string;
}

/**
 * Reads the contents of a directory and returns file information
 * @param directoryPath - The absolute path to the directory
 * @returns Array of FileInfo objects
 */
export function readDirectory(directoryPath: string): FileInfo[] {
    const results: FileInfo[] = [];

    try {
        // Check if directory exists
        if (!fs.existsSync(directoryPath)) {
            throw new Error(`Directory not found: ${directoryPath}`);
        }

        // Read directory contents
        const items = fs.readdirSync(directoryPath);

        for (const item of items) {
            const fullPath = path.join(directoryPath, item);

            try {
                const stats = fs.statSync(fullPath);

                results.push({
                    name: item,
                    path: fullPath,
                    isDirectory: stats.isDirectory(),
                    size: stats.size,
                    modifiedAt: stats.mtime,
                    extension: path.extname(item).toLowerCase(),
                });
            } catch (err) {
                // Skip files we can't access
                console.warn(`Could not read: ${fullPath}`);
            }
        }
    } catch (error) {
        console.error('Error reading directory:', error);
        throw error;
    }

    return results;
}

/**
 * Reads directory contents recursively
 * @param directoryPath - The absolute path to the directory
 * @param depth - Maximum depth to traverse (default: 3)
 * @returns Array of FileInfo objects from all subdirectories
 */
export function readDirectoryRecursive(directoryPath: string, depth: number = 3): FileInfo[] {
    const results: FileInfo[] = [];

    function traverse(currentPath: string, currentDepth: number) {
        if (currentDepth > depth) return;

        const items = readDirectory(currentPath);

        for (const item of items) {
            results.push(item);

            if (item.isDirectory && currentDepth < depth) {
                traverse(item.path, currentDepth + 1);
            }
        }
    }

    traverse(directoryPath, 0);
    return results;
}

/**
 * Reads the content of a file
 * @param filePath - The absolute path to the file
 * @returns The file content as a string
 */
export function readFileContent(filePath: string): string {
    try {
        return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
        console.error('Error reading file:', error);
        throw error;
    }
}

/**
 * Filters files by extension
 * @param files - Array of FileInfo objects
 * @param extensions - Array of extensions to filter by (e.g., ['.ts', '.js'])
 */
export function filterByExtension(files: FileInfo[], extensions: string[]): FileInfo[] {
    return files.filter(file =>
        !file.isDirectory && extensions.includes(file.extension)
    );
}

// ============================================
// EXAMPLE USAGE IN ELECTRON MAIN PROCESS
// ============================================

/*
// In your main.ts, you can use it like this:

import { readDirectory, readFileContent, filterByExtension } from './reader';
import { ipcMain, dialog } from 'electron';

// Handle IPC request from renderer to read a directory
ipcMain.handle('read-directory', async (event, dirPath: string) => {
  return readDirectory(dirPath);
});

// Handle IPC request to open folder dialog and read contents
ipcMain.handle('open-folder-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const folderPath = result.filePaths[0];
    const files = readDirectory(folderPath);
    return { folderPath, files };
  }

  return null;
});

// Handle IPC request to read file content
ipcMain.handle('read-file', async (event, filePath: string) => {
  return readFileContent(filePath);
});
*/

// ============================================
// EXAMPLE USAGE IN PRELOAD.TS
// ============================================

/*
// In your preload.ts, expose these to the renderer:

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('fileSystem', {
  readDirectory: (path: string) => ipcRenderer.invoke('read-directory', path),
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
  readFile: (path: string) => ipcRenderer.invoke('read-file', path),
});
*/

// ============================================
// EXAMPLE USAGE IN RENDERER (React/Vue/etc)
// ============================================

/*
// In your frontend code:

// Type declaration for the exposed API
declare global {
  interface Window {
    fileSystem: {
      readDirectory: (path: string) => Promise<FileInfo[]>;
      openFolderDialog: () => Promise<{ folderPath: string; files: FileInfo[] } | null>;
      readFile: (path: string) => Promise<string>;
    };
  }
}

// Usage in a component:
async function handleOpenFolder() {
  const result = await window.fileSystem.openFolderDialog();
  if (result) {
    console.log('Selected folder:', result.folderPath);
    console.log('Files:', result.files);
  }
}
*/
