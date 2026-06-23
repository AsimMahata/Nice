import { useEffect, useState } from "react";
import "./FileEx.css";
import FileItem from "./FileItem";
import PickDir from "./PickDir";
import { useWorkspaceContext } from "../../contexts/Workspace/WorkspaceProvider";
import { searchEngine } from "../../services/Search/SearchEngine";
import { FileInfo } from "../../services/FileSystem/file.options";
import { useEditorContext } from "../../contexts/Editor/EditorProvider";
import { fileSystem } from "../../services/FileSystem/FileSystem";

type props = {
    codeFile: FileInfo | null;
};

export type HandleClickResult = {
    file: FileInfo;
    content: string;
};

const FileEx = ({ }: props) => {
    //useWorkspaceContext
    const { cwd, setCurrentPath, currentPath, files, setFiles, refresh, toggleRefresh } = useWorkspaceContext();
    const { openFile } = useEditorContext();



    const [creatingFolder, setCreatingFolder] = useState(false);
    const [creatingFile, setCreatingFile] = useState(false);
    const [insideMainDir, setInsideMainDir] = useState<boolean>(false);
    const [newFolder, setNewFolder] = useState<string>("")
    const [newFile, setNewFile] = useState<string>("")

    async function handleClick(file: FileInfo): Promise<void> {
        console.log(
            'frontend file ex ->  handle click CLICKED!!',
            file.path
        );

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
            await openFile(file);
        } catch (err) {
            console.error('something error occurred', err);
            return;
        }
    }


    // init path
    useEffect(() => {
        async function init() {
            if (!cwd) {
                console.error('please set a working directory first')
                return;
            }
            const dir = cwd;
            //setCwd(dir)
            console.log('cwd is selcted so change the currentpath to main dir', cwd)
            setCurrentPath(dir);
            setInsideMainDir(true);
        }
        init();
        if (cwd) {
            console.log(`building index for ${cwd}`);
            void searchEngine.buildIndex(cwd);
        }
    }, [cwd]);

    // reload on path / refresh
    useEffect(() => {
        console.log('files list refreshed')

        async function checkIfInsideMainDir() {
            if (!currentPath) {
                console.log('please have a valid path first')
                return;
            }
            if (!cwd) {
                console.error('first define a project directory first 404', cwd)
                return;
            }
            if (!window.fileSystem) {
                console.error('file system is not defined or laoded')
                return;
            }
            try {
                const result = await window.fileSystem.isChildOf(cwd, currentPath);
                if (result.isExactMatch) {
                    setInsideMainDir(true)
                } else setInsideMainDir(false)
            } catch (err) {
                console.error('while calling isChildOf inside fileex component some error occured ', err)
            }
        }

        async function loadFiles() {
            try {
                // if current path is null we should exit
                if (!currentPath) {
                    throw new Error('you must assign a path first');
                }
                // fetch from Electron backend 
                const result: FileInfo[] = await fileSystem.readDirectory(currentPath);
                setFiles(result)

            } catch (err) {
                console.error('something went wrong', err)
            }
        }

        // when path changes or refresh is triggered load all files again and checkIfInsideMainDir

        loadFiles();
        checkIfInsideMainDir()

    }, [currentPath, refresh]);

    async function goToParentDir() {
        if (!currentPath) {
            throw new Error('FILEEX: current path not set');
        }
        try {
            const parent = await fileSystem.getParentDir(currentPath)
            console.log('parent path ', parent)
            if (parent) setCurrentPath(parent);
            else throw new Error('parent not found ')
        } catch (err) {
            console.error('inside go to parent directory some error occured', err)
        }
    }

    if (!cwd)
        return (
            <PickDir text={"Change"} />
        );

    return (
        <div className="file-ex-root">

            {/* header */}
            <div className="file-ex-header">
                <span className="path" title={currentPath || "NotAllowed"}>
                    {currentPath}
                </span>
            </div>

            {/* actions */}
            <div className="file-ex-actions">
                {insideMainDir && <button>Main</button>}
                {!insideMainDir && <button onClick={goToParentDir}>↩</button>}
                <button onClick={() => setCreatingFolder(true)}>+📁</button>
                <button onClick={() => setCreatingFile(true)}>+📄</button>
                <PickDir text="change" />
            </div>

            {/* create folder */}
            {creatingFolder && (
                <input
                    autoFocus
                    className="folder-input"
                    value={newFolder}
                    placeholder="New folder"
                    onChange={(e) => setNewFolder(e.target.value)}
                    onKeyDown={async (e) => {
                        if (e.key === "Enter") {
                            await fileSystem.createDirectory(currentPath, newFolder);
                            setNewFolder("");
                            setCreatingFolder(false);
                            toggleRefresh();
                        }
                        if (e.key === "Escape") {
                            setNewFolder("");
                            setCreatingFolder(false);
                        }
                    }}
                    onBlur={() => setCreatingFolder(false)}
                />
            )}

            {/* create file */}
            {creatingFile && (
                <input
                    autoFocus
                    className="file-input"
                    value={newFile}
                    placeholder="New file"
                    onChange={(e) => setNewFile(e.target.value)}
                    onKeyDown={async (e) => {
                        if (e.key === "Enter") {
                            await fileSystem.createNewFile(currentPath, newFile);
                            setNewFile("");
                            setCreatingFile(false);
                            toggleRefresh();
                        }
                        if (e.key === "Escape") {
                            setNewFile("");
                            setCreatingFile(false);
                        }
                    }}
                    onBlur={() => setCreatingFile(false)}
                />
            )}

            {/* file list */}
            <div className="filelist">
                {files.map((file: FileInfo) => (
                    file && <FileItem
                        key={file.name}
                        file={file}
                        handleClick={() => handleClick(file)}
                    />
                ))}
            </div>
        </div >
    );
};

export default FileEx;




