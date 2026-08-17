
// Type declaration for the exposed Electron API this global assure we can access anywhere
declare global {
    interface Window {
        fileSystem?: {
            // general
            join: (...args: string[]) => Promise<string>;
            isChildOf: (parent: string, child: string) => Promise<{ isInside: boolean; isExactMatch: boolean; }>;
            openFolderSelector: () => Promise<{ canceled: boolean; filePaths: string; folderPath: string; files: FileInfo[]; } | null>;
            getParDir: (path: string) => Promise<string>;

            // file
            createFile: (path: string) => Promise<number>;
            readFile: (path: string) => Promise<string>;
            writeFileContent: (path: string, content: string) => Promise<boolean>;
            getFileInfo: (path: string) => Promise<FileInfo>;

            // directory
            createDirectory: (path: string) => Promise<number>;
            readDirectory: (path: string) => Promise<FileInfo[]>;
        };
    }
}

export { };

