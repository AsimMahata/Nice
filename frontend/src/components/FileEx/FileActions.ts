import { useState } from "react";
import { notify } from "../../utils/notification";
import { useEditorContext } from "../../contexts/Editor/EditorProvider";
import { HandleClickResult } from "./FileEx";

//NOTE: FileInfo
export interface FileInfo {
    name: string;
    path: string;
    isDirectory: boolean;
    size: number;
    modifiedAt: Date;
    extension: string;
}

// Type declaration for the exposed Electron API this global assure we can access anywhere
declare global {
    interface Window {
        fileSystem?: {
            readDirectory: (path: string) => Promise<FileInfo[]>;
            openFolderDialog: () => Promise<{ canceled: boolean, filePaths: string, folderPath: string; files: FileInfo[] } | null>;
            readFile: (path: string) => Promise<string>;
            writeFileContent: (path: string, content: string) => Promise<boolean>;
            getParDir: (path: string) => Promise<string>;
            join: (...args: string[]) => Promise<string>;
            createFolder: (path: string) => Promise<number>;
            createFile: (path: string) => Promise<number>;
            isChildOf: (parent: string, child: string) => Promise<{ isInside: boolean, isExactMatch: boolean }>;
        };
    }
}

export function useFileActions() {
    // context
    const { setEditorState, editorState } = useEditorContext()

    const [files, setFiles] = useState<FileInfo[]>([]);
    const [currentPath, setCurrentPath] = useState<string | null>(null)
    const [refresh, setRefresh] = useState(false);
    const [_loading, setLoading] = useState(false);
    const [newFolder, setNewFolder] = useState("")
    const [newFile, setNewFile] = useState("")

    // refresh file list 
    async function loadFiles() {
        if (!window.fileSystem) {
            notify.error('error', 'Electron fileSystem API not available.Are you running in Electron ? ');
            return;
        }
        setLoading(true)
        try {
            // if current path is null we should exit
            if (!currentPath) {
                throw console.error('you must assign a path first');
            }
            // fetch from Electron backend 
            const result = await window?.fileSystem.readDirectory(currentPath);
            // console.log('got file list form backend laodfiles', result)
            setFiles(result)
            // console.log('got this ', result)
        } catch (err) {
            console.error('something went wrong', err)
        } finally {
            setLoading(false)
        }
    }
    // on click what to do
    async function selectProjectDirectory() {
        if (!window.fileSystem) {
            console.log('Electron fileSystem API not available. Are you running in Electron?');
            return;
        }
        setLoading(true)
        try {
            const result = await window?.fileSystem.openFolderDialog();
            console.log('frontend resutl   in file action', result)

        } catch (err) {
            console.error('some error occured when try to open directory', err)
        } finally {
            setLoading(false)
        }
    }
    /**
     * Handles what to do when user clicks on a file or foler
     * */

    async function handleClick(
        file: FileInfo
    ): Promise<HandleClickResult | null> {
        console.log(
            'frontend file ex -> FileActions inside handle click CLICKED!!',
            file.path
        );

        if (!window.fileSystem) {
            console.error('fileSystem is not available');
            return null;
        }

        if (!currentPath) {
            console.error('first set a working directory');
            return null;
        }

        try {
            const child = await window.fileSystem.join(
                currentPath,
                file.name
            );

            // Directory click
            if (file.isDirectory) {
                setCurrentPath(child);
                return null;
            }

            // Already open -> just switch tab
            const alreadyOpen = editorState.openFiles[file.path];

            if (alreadyOpen) {
                setEditorState((prev) => ({
                    ...prev,
                    activeFile: file.path,
                }));

                return {
                    file,
                    content: alreadyOpen.content,
                };
            }

            // First time opening file
            const content = await window.fileSystem.readFile(child);

            setEditorState((prev) => ({
                ...prev,

                openFiles: {
                    ...prev.openFiles,

                    [file.path]: {
                        content,
                        isDirty: false,
                        fileInfo: file,
                    },
                },

                openTabs: prev.openTabs.includes(file.path)
                    ? prev.openTabs
                    : [...prev.openTabs, file.path],

                activeFile: file.path,
            }));

            return {
                file,
                content,
            };
        } catch (err) {
            console.error('something error occurred', err);
            notify.error('File', String(err));
            return null;
        }
    }

    /**
     * go to the parent directory of the current directory
     * */
    async function goParentDir() {
        notify.info('clicked', 'go to par')
        try {
            if (!currentPath) {
                throw new Error('current path not set')
            }
            const parent = await window.fileSystem?.getParDir(currentPath)
            console.log('parent path ', parent)
            if (parent) setCurrentPath(parent);
            else throw new Error('parent not found ')
        } catch (err) {
            console.error('inside go to parent directory some error occured', err)
        }
    }

    // createNewFolder
    async function createNewFolder(folderName: string) {
        if (!window.fileSystem) {
            notify.error('error', 'Electron fileSystem API not available.Are you running in Electron ? ');
            return;
        }
        if (!folderName) return;
        if (!currentPath) {
            console.error('please be inside a valid folder')
            return;
        }
        try {
            const location = await window.fileSystem.join(currentPath, folderName)
            const result = await window.fileSystem.createFolder(location)
            if (result == 1) {
                notify.success('done', 'success')
            } else if (result == -1) {
                notify.error('err', 'some error occured')
                throw new Error('some error occured while createNewFolder')
            } else notify.info('folder already exists', '!!!!!')
        } catch (err) {
            console.error('while createNewFolder', err)
            notify.error('error', "Can't create folder");
        } finally {
            setRefresh(v => !v);
        }
    }
    //createNewFiles
    async function createNewFiles(fileName: string) {
        if (!fileName) return;
        if (!window.fileSystem) {
            notify.error('error', 'Electron fileSystem API not available.Are you running in Electron ? ');
            return;
        }
        if (!currentPath) {
            console.error('please be inside a valid folder')
            return;
        }
        try {
            const filePath = await window.fileSystem.join(currentPath, fileName)
            const result = await window.fileSystem.createFile(filePath);
            if (result == 1) {
                notify.success('done', 'success')
            } else if (result == -1) {
                notify.error('err', 'some error occured')
                throw new Error('some error occured while createNewFiles')
            } else notify.info('file already exists', '!!!!!')
        } catch (err) {
            console.error('while createNewFile', err)
            notify.error('error', "Can't create file");
        } finally {
            setRefresh(v => !v);
        }
    }
    // save Files

    async function saveFiles(path: string) {
        console.log('file save was requested', path)
        if (!window.fileSystem) {
            notify.error('error', 'Electron fileSystem API not available.Are you running in Electron ? ');
            return false;
        }
        const file = editorState.openFiles[path];
        if (!file) return false;
        try {
            const success = await window.fileSystem.writeFileContent(
                path,
                file.content
            );
            console.log('status of file save ----', success)
            return success;
        } catch (err) {
            console.error('error occured while saving file ', err)
            notify.error('Save Failed', String(err));
            return false;
        }
    }

    return {
        selectProjectDirectory,
        files,
        currentPath,
        setCurrentPath,
        refresh,
        loadFiles,
        handleClick,
        goParentDir,
        createNewFolder,
        createNewFiles,
        newFile,
        setNewFile,
        newFolder,
        setNewFolder,
        saveFiles
    };
}
