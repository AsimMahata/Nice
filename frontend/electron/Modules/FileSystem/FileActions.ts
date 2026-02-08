import { dialog } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

interface FileInfo {
    name: string;
    path: string;
    isDirectory: boolean;
    size: number;
    modifiedAt: Date;
    extension: string;
}

// create a new file (actually folder — keeping your intent)
//  1 -> success
//  0 -> already exists
// -1 -> unsuccessful
export async function createNewFile(filePath: string) {
    try {
        await fs.writeFile(filePath, "", { flag: 'wx' });
        return 1;
    } catch (err: any) {
        if (err?.code === "EEXIST") return 0;
        console.error("something wrong happened while making new file", err);
        return -1;
    }
}

// - If it starts with '..', its outside.
// - If it is empty, it's the SAME directory.
export function isChildOf(parent: string, child: string) {
    const relative = path.relative(parent, child);
    const isInside = relative === "" || (!relative.startsWith('..') && !path.isAbsolute(relative));
    return {
        isInside,
        isExactMatch: relative === ""
    };
}

// create a new folder
//  1 -> success
//  0 -> already exists
// -1 -> unsuccessful
export async function createNewFolder(folderName: string) {
    try {
        await fs.mkdir(folderName, { recursive: true });
        return 1;
    } catch (err: any) {
        if (err?.code === "EEXIST") return 0;
        console.error('something wrong happened while making new folder', err);
        return -1;
    }
}

// join path 
export function join(...args: string[]) {
    return path.join(...args);
}

// get parent directory 
export function getParentDirectory(directoryPath: string) {
    return path.dirname(directoryPath);
}

// open directory dialog
export async function openDirectory() {
    try {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory'],
        });
        return result;
    } catch (err) {
        console.error('err opening folder selector');
        throw err;
    }
}

// read directory 
export async function readDirectory(directoryPath: string): Promise<FileInfo[]> {
    const results: FileInfo[] = [];

    console.log('in backend path readDirectory function got this path ', directoryPath)
    try {
        const items = await fs.readdir(directoryPath);
        for (const item of items) {
            const fullPath = path.join(directoryPath, item);

            try {
                const stats = await fs.stat(fullPath);

                results.push({
                    name: item,
                    path: fullPath,
                    isDirectory: stats.isDirectory(),
                    size: stats.size,
                    modifiedAt: stats.mtime,
                    extension: path.extname(item).toLowerCase(),
                });
            } catch {
                console.warn(`Could not read: ${fullPath}`);
            }
        }
    } catch (error) {
        console.error('Error reading directory:', error);
        throw error;
    }

    return results;
}

// read file 
export async function readFileContent(filePath: string): Promise<string> {
    try {
        return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
        console.error('Error reading file:', error);
        throw error;
    }
}
