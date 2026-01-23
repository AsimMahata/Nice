import React, { useState } from "react";
import { resolve, dirname, BaseDirectory } from "@tauri-apps/api/path";
import { create, exists, mkdir, readDir, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

//NOTE: FileEntry
export interface FileEntry {
  name: string;
  isDir: boolean;
  dir: string;
}

type props = {
  showToast: (msg: string) => void,
  setCode: React.Dispatch<React.SetStateAction<string>>
}

export function useFileActions({ showToast, setCode }: props) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [refresh, setRefresh] = useState(false);
  const [newFolder, setNewFolder] = useState("")
  const [newFile, setNewFile] = useState("")

  // refresh file list 
  async function loadFiles() {
    if (!currentPath) return;

    const entries = await readDir(currentPath);
    setFiles(
      entries.map(e => ({
        name: e.name ?? "",
        isDir: e.isDirectory,
        dir: currentPath
      }))
    );
  }
  // on click what to do

  async function handleClick(file: FileEntry, setCodeFile: React.Dispatch<React.SetStateAction<FileEntry | null>>) {
    // if Directory open else open file content
    if (file.isDir) {
      const next = await resolve(file.dir, file.name);
      setCurrentPath(next);
    } else {
      try {
        const content = await readRawFiles(file)
        setCode(content || "")
        setCodeFile(file)
        console.log(content)
        console.log('file', file)
      } catch (err) {
        showToast("something went wrong")
      }
    }
  }

  // go to parent Directory
  async function goParentDir() {
    try {
      const parent = await dirname(currentPath);
      if (await exists(parent)) setCurrentPath(parent);
      else showToast("Directory does not exist");
    } catch {
      showToast("Permission denied");
    }
  }

  // createNewFolder
  async function createNewFolder(folderName: string) {
    if (!folderName) return;

    const location = `${currentPath}/${folderName}`;
    if (await exists(location)) return showToast("Folder already exists");

    try {
      await mkdir(location, { baseDir: BaseDirectory.Home });
    } catch {
      showToast("Can't create folder");
    } finally {
      setRefresh(v => !v);
    }
  }
  //createNewFiles
  async function createNewFiles(fileName: string) {
    if (!fileName) return;

    const location = `${currentPath}/${fileName}`;
    if (await exists(location)) return showToast("File already exists");

    try {
      const file = await create(location, { baseDir: BaseDirectory.Home });
      await file.close();
    } catch {
      showToast("Can't create file");
    } finally {
      setRefresh(v => !v);
    }
  }


  // Read Files 
  async function readRawFiles(file: FileEntry) {
    if (!file.name) return;
    const fileLocation = file.dir + "/" + file.name;
    const fileContent = await readTextFile(fileLocation,
      {
        baseDir: BaseDirectory.Home
      }
    );

    return fileContent;
  }

  // save Files

  async function saveFiles(contents: string, file: FileEntry | null) {
    if (!file || !contents) return;
    console.log(contents)
    const fileLocation = file.dir + "/" + file.name;
    console.log(fileLocation);
    try {
      await writeTextFile(fileLocation, contents, {
        baseDir: BaseDirectory.Home,
      });
    } catch (err) {
      console.log(err);
    }
  }

  return {
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
