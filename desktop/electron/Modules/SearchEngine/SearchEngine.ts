import { FileInfo, readDirectory } from "../FileSystem/FileActions";
import { logger } from "../Logger/Logger";

export interface ScanResult {
    files: FileInfo[];
    pendingFolders: string[];
}
export async function scanDirectory(path: string): Promise<ScanResult> {
    logger.info('SearchEngine', `scanDirectory requested for ${path}`);
    const result: ScanResult = {
        files: [],
        pendingFolders: [],
    }
    try {
        const directoryContents: FileInfo[] = await readDirectory(path);
        for (const content of directoryContents) {
            if (content.isDirectory) result.pendingFolders.push(content.path)
            else result.files.push(content)
        }
        logger.info('SearchEngine', `Directory scan complete for ${path}`, { fileCount: result.files.length, folderCount: result.pendingFolders.length });
        return result;
    } catch (err) {
        logger.error('SearchEngine', `Error reading directory contents of directory : ${path}`, err);
        throw new Error(`Some error while reading directoryContents of dirctory : ${path}`)
    }
}
