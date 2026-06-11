import { useEffect, useState } from "react";
import "./FileEx.css";
import { FileInfo, useFileActions } from "./FileActions";
import FileItem from "./FileItem";
import PickDir from "./PickDir";
import { useWorkspaceContext } from "../../contexts/Workspace/WorkspaceProvider";

type props = {
    codeFile: FileInfo | null;
};

export type HandleClickResult = {
    file: FileInfo;
    content: string;
};

const FileEx = ({ }: props) => {
    //useWorkspaceContext
    const { cwd, setCurrentPath, currentPath, files, refresh } = useWorkspaceContext();

    const FileActions = useFileActions()


    const [creatingFolder, setCreatingFolder] = useState(false);
    const [creatingFile, setCreatingFile] = useState(false);
    const [insideMainDir, setInsideMainDir] = useState<boolean>(false);

    const handleClick = async (file: FileInfo) => {
        const result: HandleClickResult | null = await FileActions.handleClick(file)
        if (!result) return;
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
    }, [cwd]);

    // reload on path / refresh
    useEffect(() => {
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

        // when path changes or refresh is triggered load all files again and checkIfInsideMainDir
        FileActions.loadFiles();
        checkIfInsideMainDir()

    }, [currentPath, refresh]);


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
                {!insideMainDir && <button onClick={FileActions.goParentDir}>↩</button>}
                <button onClick={() => setCreatingFolder(true)}>+📁</button>
                <button onClick={() => setCreatingFile(true)}>+📄</button>
                <PickDir text="change" />
            </div>

            {/* create folder */}
            {creatingFolder && (
                <input
                    autoFocus
                    className="folder-input"
                    value={FileActions.newFolder}
                    placeholder="New folder"
                    onChange={(e) => FileActions.setNewFolder(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            FileActions.createNewFolder(FileActions.newFolder);
                            FileActions.setNewFolder("");
                            setCreatingFolder(false);
                        }
                        if (e.key === "Escape") {
                            FileActions.setNewFolder("");
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
                    value={FileActions.newFile}
                    placeholder="New file"
                    onChange={(e) => FileActions.setNewFile(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            FileActions.createNewFiles(FileActions.newFile);
                            FileActions.setNewFile("");
                            setCreatingFile(false);
                        }
                        if (e.key === "Escape") {
                            FileActions.setNewFile("");
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




