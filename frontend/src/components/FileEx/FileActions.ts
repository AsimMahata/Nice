import React, { useState } from "react";
import { notify } from "../../utils/notification";
import { useEditorContext } from "../../contexts/Editor/EditorProvider";

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
            getParDir: (path: string) => Promise<string>;
            join: (...args: string[]) => Promise<string>;
            createFolder: (path: string) => Promise<number>;
            createFile: (path: string) => Promise<number>;
            isChildOf: (parent: string, child: string) => Promise<{ isInside: boolean, isExactMatch: boolean }>;
        };
    }
}
type props = {
    setCode: React.Dispatch<React.SetStateAction<string>>
}

export function useFileActions({ setCode }: props) {
    // context
    const { setIsDirty } = useEditorContext()


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
            console.log('got file list form backend laodfiles', result)
            setFiles(result)
            console.log('got this ', result)
        } catch (err) {
            console.log('something went wrong', err)
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
            console.log('frontend resutl', result)

        } catch (err) {
            console.log('some error occured when try to open directory', err)
        } finally {
            setLoading(false)
        }
    }
    /**
     * Handles what to do when user clicks on a file or foler
     * */
    async function handleClick(file: FileInfo, setCodeFile: React.Dispatch<React.SetStateAction<FileInfo | null>>, setOpenedFiles: React.Dispatch<React.SetStateAction<FileInfo[]>>) {
        console.log('frontend file ex -> FileActions inside handle click CLICKED!!', file)
        // if Directory open else open file content
        if (!window.fileSystem) {
            console.error('fileSystem is not available')
            return;
        }
        if (!currentPath) {
            console.error('first set a working directory')
            return;
        }
        try {
            const child = await window.fileSystem.join(currentPath, file.name)
            if (file.isDirectory) {
                setCurrentPath(child);
                setOpenedFiles([])
            } else {
                try {
                    const content = await window.fileSystem.readFile(child)
                    setCode(content || "")
                    setCodeFile(file)
                    setIsDirty(false)
                    setOpenedFiles((prev) => {
                        if (prev) return [file, ...prev]
                        return [file]
                    })
                    console.log('FileActions', 'handleClick', content)
                    console.log('FileActions', 'handleClick', file)
                } catch (err) {
                    notify.error('Content', 'Could not find ?? ' + err)
                }
            }
        } catch (err) {
            console.error('something error occured', err)
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

    async function saveFiles(contents: string, file: FileInfo | null) {
        console.log('file save was requested')
        if (!contents) return;
        if (!file) return;
        return;
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
