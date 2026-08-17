// // Type declaration for the exposed Electron API this global assure we can access anywhere
// declare global {
//     interface Window {
//         fileSystem?: {
//             readDirectory: (path: string) => Promise<FileInfo[]>;
//             openFolderDialog: () => Promise<{ canceled: boolean, filePaths: string, folderPath: string; files: FileInfo[] } | null>;
//             readFile: (path: string) => Promise<string>;
//             writeFileContent: (path: string, content: string) => Promise<boolean>;
//             getParDir: (path: string) => Promise<string>;
//             join: (...args: string[]) => Promise<string>;
//             createFolder: (path: string) => Promise<number>;
//             createFile: (path: string) => Promise<number>;
//             isChildOf: (parent: string, child: string) => Promise<{ isInside: boolean, isExactMatch: boolean }>;
//             getFileInfo: (path: string) => Promise<FileInfo>
//         };
//     }
// }
//
// export { }
