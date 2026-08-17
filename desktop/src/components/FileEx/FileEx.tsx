import { useEffect, useState } from "react";
import { FolderPlus, FilePlus, CornerUpLeft, Home, RefreshCw, FolderOpen } from "lucide-react";
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
    const { cwd, setCurrentPath, currentPath, files, setFiles, refresh, toggleRefresh } = useWorkspaceContext();
    const { openFile } = useEditorContext();

    const [creatingFolder, setCreatingFolder] = useState(false);
    const [creatingFile, setCreatingFile] = useState(false);
    const [insideMainDir, setInsideMainDir] = useState<boolean>(false);
    const [newFolder, setNewFolder] = useState<string>("");
    const [newFile, setNewFile] = useState<string>("");

    async function handleClick(file: FileInfo): Promise<void> {
        console.log('frontend file ex -> handle click CLICKED!!', file.path);

        if (!currentPath) {
            console.error('first set a working directory');
            return;
        }

        try {
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

    useEffect(() => {
        async function init() {
            if (!cwd) {
                console.error('please set a working directory first');
                return;
            }
            const dir = cwd;
            setCurrentPath(dir);
            setInsideMainDir(true);
        }
        init();
        if (cwd) {
            console.log(`building index for ${cwd}`);
            void searchEngine.buildIndex(cwd);
        }
    }, [cwd]);

    useEffect(() => {
        async function checkIfInsideMainDir() {
            if (!currentPath || !cwd || !window.fileSystem) return;
            try {
                const result = await window.fileSystem.isChildOf(cwd, currentPath);
                if (result.isExactMatch) {
                    setInsideMainDir(true);
                } else setInsideMainDir(false);
            } catch (err) {
                console.error('while calling isChildOf inside fileex component some error occured ', err);
            }
        }

        async function loadFiles() {
            try {
                if (!currentPath) return;
                const result: FileInfo[] = await fileSystem.readDirectory(currentPath);
                setFiles(result);
            } catch (err) {
                console.error('something went wrong loading files', err);
            }
        }

        loadFiles();
        checkIfInsideMainDir();
    }, [currentPath, refresh]);

    async function goToParentDir() {
        if (!currentPath) return;
        try {
            const parent = await fileSystem.getParentDir(currentPath);
            if (parent) setCurrentPath(parent);
        } catch (err) {
            console.error('inside go to parent directory some error occured', err);
        }
    }

    if (!cwd) {
        return (
            <div className="dir-picker-placeholder">
                <FolderOpen size={40} style={{ color: "var(--accent-light)" }} />
                <p>No Folder Opened</p>
                <PickDir text="Open Folder" />
            </div>
        );
    }

    return (
        <div className="file-ex-root">
            {/* Header */}
            <div className="file-ex-header">
                <span className="file-ex-title">Explorer</span>
                <div className="file-ex-actions">
                    {!insideMainDir && (
                        <button
                            className="file-ex-action-btn"
                            onClick={() => cwd && setCurrentPath(cwd)}
                            title="Go to Project Root"
                        >
                            <Home size={14} />
                        </button>
                    )}
                    {!insideMainDir && (
                        <button
                            className="file-ex-action-btn"
                            onClick={goToParentDir}
                            title="Go Up"
                        >
                            <CornerUpLeft size={14} />
                        </button>
                    )}
                    <button
                        className="file-ex-action-btn"
                        onClick={() => setCreatingFile(true)}
                        title="New File"
                    >
                        <FilePlus size={14} />
                    </button>
                    <button
                        className="file-ex-action-btn"
                        onClick={() => setCreatingFolder(true)}
                        title="New Folder"
                    >
                        <FolderPlus size={14} />
                    </button>
                    <button
                        className="file-ex-action-btn"
                        onClick={toggleRefresh}
                        title="Refresh Explorer"
                    >
                        <RefreshCw size={13} />
                    </button>
                </div>
            </div>

            {/* Path Breadcrumb */}
            <div className="path-breadcrumb" title={currentPath || ""}>
                {currentPath}
            </div>

            {/* Create Folder Input */}
            {creatingFolder && (
                <input
                    autoFocus
                    className="folder-input"
                    value={newFolder}
                    placeholder="New folder name..."
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

            {/* Create File Input */}
            {creatingFile && (
                <input
                    autoFocus
                    className="file-input"
                    value={newFile}
                    placeholder="New file name..."
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

            {/* File List */}
            <div className="filelist">
                {files.map((file: FileInfo) => (
                    file && <FileItem
                        key={file.path || file.name}
                        file={file}
                        handleClick={() => handleClick(file)}
                    />
                ))}
            </div>
        </div>
    );
};

export default FileEx;




