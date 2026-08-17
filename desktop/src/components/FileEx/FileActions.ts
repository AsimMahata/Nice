import { useState } from "react";
import { notify } from "../../utils/notification";
import { useEditorContext } from "../../contexts/Editor/EditorProvider";
import { useWorkspaceContext } from "../../contexts/Workspace/WorkspaceProvider";
import { FileInfo } from "../../services/FileSystem/file.options";

//FIX: here i am exporting it and many modules is recieving it where as it should be taken from fileactions.options.ts
export function useFileActions() {
    // context
    const { setEditorState, editorState, buffersRef } = useEditorContext()
    const { setFiles, currentPath, setCurrentPath, setRefresh } = useWorkspaceContext()
    const [, setLoading] = useState(false);
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
            const result = await window?.fileSystem.openFolderSelector();
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

    async function handleClick(file: FileInfo): Promise<void> {
        console.log(
            'frontend file ex -> FileActions inside handle click CLICKED!!',
            file.path
        );

        if (!window.fileSystem) {
            console.error('fileSystem is not available');
            return;
        }

        if (!currentPath) {
            console.error('first set a working directory');
            return;
        }

        try {
            // Directory click
            if (file.isDirectory) {
                setCurrentPath(file.path);
                return;
            }

            // Already open -> just switch tab
            const alreadyOpen = editorState.openedFiles[file.path];

            if (alreadyOpen) {
                setEditorState((prev) => ({
                    ...prev,
                    activeFile: file.path,
                }));

                return;
            }

            // First time opening file
            const content = await window.fileSystem.readFile(file.path);

            buffersRef.current[file.path] = content

            setEditorState((prev) => ({
                ...prev,

                openedFiles: {
                    ...prev.openedFiles,

                    [file.path]: {
                        isDirty: false,
                        fileInfo: file,
                    },
                },

                openedTabs: prev.openedTabs.includes(file.path)
                    ? prev.openedTabs
                    : [...prev.openedTabs, file.path],

                activeFile: file.path,
            }));

        } catch (err) {
            console.error('something error occurred', err);
            notify.error('File', String(err));
            return;
        }
    }

    /**
     * go to the parent directory of the current directory
     * */
    async function goParentDir() {
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
            const result = await window.fileSystem.createDirectory(location)
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
    async function createNewFiles(fileName: string): Promise<FileInfo | null> {
        if (!fileName) return null;
        if (!window.fileSystem) {
            notify.error('error', 'Electron fileSystem API not available.Are you running in Electron ? ');
            return null;
        }
        if (!currentPath) {
            console.error('please be inside a valid folder')
            return null;
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

            const fileInfo: FileInfo = {
                name: fileName,
                path: filePath,
                isDirectory: false,
                size: 0,
                modifiedAt: new Date(),
                extension: fileName.substring(fileName.lastIndexOf('.')).toLowerCase()
            };
            return fileInfo;
        } catch (err) {
            console.error('while createNewFile', err)
            notify.error('error', "Can't create file");
            return null;
        } finally {
            setRefresh(v => !v);
        }
    }
    // save Files
    async function saveFiles(path: string, overrideContent?: string) {
        console.log('file save was requested', path)
        if (!window.fileSystem) {
            notify.error('error', 'Electron fileSystem API not available.Are you running in Electron ? ');
            return false;
        }

        if (!path) {
            notify.error('error', "paht not available");
            return false;
        }

        const file = editorState.openedFiles[path];
        const content = buffersRef.current[path];
        console.log(content, '----------------------')
        if (!file) return false;

        try {
            const success = await window.fileSystem.writeFileContent(
                path,
                overrideContent !== undefined ? overrideContent : content
            );
            console.log('status of file save ----', success)
            return success;
        } catch (err) {
            console.error('error occured while saving file ', err)
            notify.error('Save Failed', String(err));
            return false;
        }
    }

    async function saveActiveFile() {
        const path = editorState.activeFile;

        if (!path) return false;

        const success = await saveFiles(path);

        if (success) {
            setEditorState(prev => ({
                ...prev,
                openedFiles: {
                    ...prev.openedFiles,
                    [path]: {
                        ...prev.openedFiles[path],
                        isDirty: false,
                    },
                },
            }));
        }

        return success;
    }

    return {
        selectProjectDirectory,
        loadFiles,
        handleClick,
        goParentDir,
        createNewFolder,
        createNewFiles,
        newFile,
        setNewFile,
        newFolder,
        setNewFolder,
        saveFiles,
        saveActiveFile
    };
}
