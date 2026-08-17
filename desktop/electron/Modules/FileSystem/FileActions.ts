import { dialog } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../Logger/Logger';

export interface FileInfo {
    name: string;
    path: string;
    isDirectory: boolean;
    size: number;
    modifiedAt: Date;
    extension: string;
}

//  Save an already existing File 
//  1 -> success
// -1 -> unsuccessful
export async function saveExistingFile(filePath: string) {
    try {
        await fs.writeFile(filePath, "", { flag: 'wx' });
        return 1;
    } catch (err: any) {
        if (err?.code === "EEXIST") return 0;
        logger.error("FileActions", "Something wrong happened while making existing file", err);
        return -1;
    }
}

// create a new file
//  1 -> success
//  0 -> already exists
// -1 -> unsuccessful
export async function createNewFile(filePath: string) {
    try {
        await fs.writeFile(filePath, "", { flag: 'wx' });
        return 1;
    } catch (err: any) {
        if (err?.code === "EEXIST") return 0;
        logger.error("FileActions", "Something wrong happened while making new file", err);
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
        logger.error("FileActions", "Something wrong happened while making new folder", err);
        return -1;
    }
}

// join path 
export function join(...args: string[]) {
    return path.join(...args);
}

// get parent directory 
export function getParentDirectory(Path: string) {
    return path.dirname(Path);
}

// open directory dialog
export async function openDirectory() {
    try {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory'],
        });
        return result;
    } catch (err) {
        logger.error("FileActions", "Error opening folder selector", err);
        throw err;
    }
}

// read directory 
export async function readDirectory(directoryPath: string): Promise<FileInfo[]> {
    const results: FileInfo[] = [];

    logger.debug("FileActions", `Reading directory: ${directoryPath}`);
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
                logger.warn("FileActions", `Could not read stats for: ${fullPath}`);
            }
        }
    } catch (error) {
        logger.error("FileActions", "Error reading directory:", error);
        throw error;
    }

    return results;
}

// read file 
export async function readFileContent(filePath: string): Promise<string> {
    try {
        return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
        logger.error("FileActions", "Error reading file:", error);
        throw error;
    }
}
// writeFile
export async function writeFileContent(
    filePath: string,
    content: string
): Promise<boolean> {
    try {
        await fs.writeFile(filePath, content, 'utf8');
        return true;
    } catch (error) {
        logger.error("FileActions", "Error writing file:", error);
        return false;
    }
}
export async function getFileInfo(filePath: string): Promise<FileInfo> {
    const stats = await fs.stat(filePath);
    const name = path.basename(filePath);
    return {
        name,
        path: filePath,
        isDirectory: stats.isDirectory(),
        size: stats.size,
        modifiedAt: stats.mtime,
        extension: path.extname(name).toLowerCase(),
    }
}
