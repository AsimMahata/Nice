import React, { useEffect, useState } from "react";
import "./FileEx.css";
import { FileInfo, useFileActions } from "./FileAcations";
import { useToast } from "../../utils/Toast";
import FileItem from "./FileItem";
import PickDir from "./PickDir";

type props = {
    codeFile: FileInfo | null,
    setCodeFile: React.Dispatch<React.SetStateAction<FileInfo | null>>,
    code: string,
    setCode: React.Dispatch<React.SetStateAction<string>>,
    savingCode: boolean,
    setSavingCode: React.Dispatch<React.SetStateAction<boolean>>,
    mainDir: string | null,
    setMainDir: React.Dispatch<React.SetStateAction<string | null>>,
}

const FileEx = ({ codeFile, setCodeFile, code, setCode, savingCode, mainDir, setMainDir }: props) => {
    const Toast = useToast();
    const props = {
        showToast: Toast.showToast,
        setCode: setCode
    }
    const FileActions = useFileActions(props);

    const [creatingFolder, setCreatingFolder] = useState(false);
    const [creatingFile, setCreatingFile] = useState(false);
    const [insideMainDir, setInsideMainDir] = useState<boolean>(false);

    useEffect(() => {
        FileActions.saveFiles(code, codeFile)
        console.log('triggered')
    }, [savingCode])
    // init path
    useEffect(() => {
        async function init() {
            const dir = mainDir;
            //setMainDir(dir)
            FileActions.setCurrentPath(dir);
            setInsideMainDir(true)
        }
        init();
    }, [mainDir]);

    // reload on path / refresh
    useEffect(() => {
        FileActions.loadFiles();
        if (FileActions.currentPath?.startsWith(mainDir ?? "NotAllowed")) {
            console.log('insideScope')
            if (FileActions.currentPath === mainDir) {
                setInsideMainDir(true)
            } else {
                setInsideMainDir(false)
            }
        } else {
            console.log('Frontend/FileEx/Refesh/permission not allowed || null')
        }
        console.log(insideMainDir)
    }, [FileActions.currentPath, FileActions.refresh]);

    if (!mainDir) return <PickDir text={"Change"} mainDir={mainDir} setMainDir={setMainDir} />
    return (
        <div className="file-ex-root">
            {/* toast */}
            {Toast.toast && <div className="toast">{Toast.toast}</div>}

            {/* header */}
            <div className="file-ex-header">
                <span className="path" title={FileActions.currentPath || "NotAllowed"}>
                    {FileActions.currentPath}
                </span>
            </div>

            {/* actions */}
            <div className="file-ex-actions">
                {insideMainDir && <button>Main</button>}
                {!insideMainDir && <button onClick={FileActions.goParentDir}>↩</button>}
                <button onClick={() => setCreatingFolder(true)}>+📁</button>
                <button onClick={() => setCreatingFile(true)}>+📄</button>
                <PickDir text="change" mainDir={mainDir} setMainDir={setMainDir} />
            </div>

            {/* create folder */}
            {
                creatingFolder && (
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
                )
            }

            {/* create file */}
            {
                creatingFile && (
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
                )
            }

            {/* file list */}
            <div className="filelist">
                {FileActions.files.map((file) => (
                    <FileItem
                        key={file.name}
                        file={file}
                        handleClick={() => FileActions.handleClick(file, setCodeFile)}
                    />
                ))}
            </div>
        </div >
    );
};

export default FileEx;
