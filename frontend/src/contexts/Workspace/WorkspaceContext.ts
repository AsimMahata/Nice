import React, { createContext } from "react";
import { FileInfo } from "../../components/FileEx/FileActions";

interface WorkspaceContextType {
    cwd: string | null,
    setCwd: React.Dispatch<React.SetStateAction<string | null>>,
    openedFiles: FileInfo[],
    setOpenedFiles: React.Dispatch<React.SetStateAction<FileInfo[]>>,
    openedFileIndex: number | null,
    setOpenedFileIndex: React.Dispatch<React.SetStateAction<number | null>>,
}
const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)


export default WorkspaceContext
