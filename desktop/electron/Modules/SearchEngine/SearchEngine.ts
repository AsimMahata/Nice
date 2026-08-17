import { FileInfo, readDirectory } from "../FileSystem/FileActions";

export interface ScanResult {
    files: FileInfo[];
    pendingFolders: string[];
}
export async function scanDirectory(path: string): Promise<ScanResult> {
    console.log('scanDirectory has been requested for ', path)
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
        console.log("success in reading the directoryContents in scanInBackend", result);
        return result;
    } catch (err) {
        throw new Error(`Some error while reading directoryContents of dirctory : ${path}`)
    }
}
