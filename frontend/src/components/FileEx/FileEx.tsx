import React, { useEffect, useState } from "react";
import { homeDir } from "@tauri-apps/api/path";
import "./FileEx.css";
import { FileEntry, useFileActions } from "./FileAcations";
import { useToast } from "../../utils/Toast";
import FileItem from "./FileItem";

type props = {
  codeFile: FileEntry | null,
  setCodeFile: React.Dispatch<React.SetStateAction<FileEntry | null>>,
  code: string,
  setCode: React.Dispatch<React.SetStateAction<string>>,
  savingCode: boolean,
  setSavingCode: React.Dispatch<React.SetStateAction<boolean>>,
}

const FileEx = ({ codeFile, setCodeFile, code, setCode, savingCode }: props) => {
  const Toast = useToast();
  const props = {
    showToast: Toast.showToast,
    setCode: setCode
  }
  const FileActions = useFileActions(props);

  const [creatingFolder, setCreatingFolder] = useState(false);
  const [creatingFile, setCreatingFile] = useState(false);

  useEffect(() => {
    FileActions.saveFiles(code, codeFile)
  }, [savingCode])
  // init path
  useEffect(() => {
    async function init() {
      const home = await homeDir();
      FileActions.setCurrentPath(`${home}/dev/testing`);
    }
    init();
  }, []);

  // reload on path / refresh
  useEffect(() => {
    FileActions.loadFiles();
  }, [FileActions.currentPath, FileActions.refresh]);

  return (
    <div className="file-ex-root">
      {/* toast */}
      {Toast.toast && <div className="toast">{Toast.toast}</div>}

      {/* header */}
      <div className="file-ex-header">
        <span className="path" title={FileActions.currentPath}>
          {FileActions.currentPath}
        </span>
      </div>

      {/* actions */}
      <div className="file-ex-actions">
        <button onClick={FileActions.goParentDir}>↩</button>
        <button onClick={() => setCreatingFolder(true)}>+📁</button>
        <button onClick={() => setCreatingFile(true)}>+📄</button>
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
        {FileActions.files.map((file) => (
          <FileItem
            key={file.name}
            file={file}
            handleClick={() => FileActions.handleClick(file, setCodeFile)}
          />
        ))}
      </div>
    </div>
  );
};

export default FileEx;
