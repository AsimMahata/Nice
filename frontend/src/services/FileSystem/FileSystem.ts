import { FileInfo } from "./file.options";
//TODO: After calling them refresh if you want to refresh
export class FileSystem {

    async join(...args: string[]) {
        if (!window.fileSystem) {
            throw new Error("JOIN: Electron fileSystem API not available.Are you running in Electron ?");
        }
        return window.fileSystem.join(...args);
    }

    async readFile(path: string): Promise<string> {
        if (!window.fileSystem) {
            throw new Error("READFILE: Electron fileSystem API not available.Are you running in Electron ?");
        }
        return window.fileSystem.readFile(path);
    }

    async writeFile(path: string, content: string) {
        if (!window.fileSystem) {
            throw new Error('WRITEFILE: Electron fileSystem API not available.Are you running in Electron ? ');
        }
        return window.fileSystem.writeFileContent(path, content);
    }


    async createNewFile(path: string | null, fileName: string | null) {
        if (!window.fileSystem) {
            throw new Error('CREATENEWFILE: Electron fileSystem API not available.Are you running in Electron ? ');
        }
        if (!fileName) {
            throw new Error('CREATENEWFILE:Please Mention FILE Name');
        }
        if (!path) {
            throw new Error('Please Mention a Valid  Path Where You want to create A new file');
        }
        const filePath = await window.fileSystem.join(path, fileName)
        return window.fileSystem.createFile(filePath);
    }

    async getFileInfo(path: string): Promise<FileInfo> {
        if (!window.fileSystem) {
            throw new Error('GETFILEINFO: Electron fileSystem API not available.Are you running in Electron ? ');
        }
        if (!path) {
            throw new Error('Please Mention a Valid  Path to get file info');
        }
        return window.fileSystem?.getFileInfo(path);
    }

    async deleteFile(path: string) {
        if (!window.fileSystem) {
            throw new Error('DELETEFILE: Electron fileSystem API not available.Are you running in Electron ? ');
        }
        if (!path) {
            throw new Error('Please Mention a Valid  Path to delete file');
        }
    }

    async rename() {

    }

    async createDirectory(path: string | null, folderName: string | null) {
        if (!window.fileSystem) {
            throw new Error('CREATENEWFOLDER: Electron fileSystem API not available.Are you running in Electron ? ');
        }
        if (!folderName) {
            throw new Error('Please Mention Folder Name');
        }
        if (!path) {
            throw new Error('Please Mention a Valid  Path Where You want to create A new folder');
        }
        const location = await window.fileSystem.join(path, folderName)
        return window.fileSystem.createDirectory(location)

    }

    async readDirectory(path: string): Promise<FileInfo[]> {
        if (!window.fileSystem) {
            throw new Error('READDIRECTORY: Electron fileSystem API not available.Are you running in Electron ? ');
        }
        if (!path) {
            throw new Error('Please Mention a Valid  Path to read Folder');
        }
        return window.fileSystem.readDirectory(path);
    }

    async deleteDirectory(path: string) {
        if (!window.fileSystem) {
            throw new Error('DELETEFOLDER: Electron fileSystem API not available.Are you running in Electron ? ');
        }
        if (!path) {
            throw new Error('Please Mention a Valid  Path to delete Folder');
        }
    }

    async deleteDirectoryRec(path: string) {
        if (!window.fileSystem) {
            throw new Error('DELETEFOLDER: Electron fileSystem API not available.Are you running in Electron ? ');
        }
        if (!path) {
            throw new Error('Please Mention a Valid  Path to delete Folder');
        }
    }

    async getParentDir(path: string) {
        if (!path) {
            throw new Error('Provide a valid Path first');
        }
        return window.fileSystem?.getParDir(path);
    }

    copy() {
        throw new Error('TODO')
    }
    move() {
        throw new Error('TODO')
    }
    exists() { }

    async saveFile(path: string, overrideContent: string): Promise<boolean> {
        console.log('file save was requested', path)
        if (!window.fileSystem) {
            throw new Error('SAVEFILE: Electron fileSystem API not available.Are you running in Electron ? ');
        }
        if (!path) {
            throw new Error('SAVEFILE: Please Mention a Valid Path to save file');
        }
        return window.fileSystem.writeFileContent(
            path,
            overrideContent
        );
    }
    async openFolderSelector() {
        if (!window.fileSystem) {
            throw new Error('OPENFOLDERSELECTOR: Electron fileSystem API not available.Are you running in Electron ? ');
        }
        return window.fileSystem.openFolderSelector();
    }

}


export const fileSystem = new FileSystem();
