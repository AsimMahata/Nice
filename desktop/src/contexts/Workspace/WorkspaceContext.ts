import React, { createContext } from "react";
import { FileInfo } from "../../services/FileSystem/file.options";

export type { ExecutionStatus, CodeActionResult } from "../CodeAction/CodeActionContext";

interface WorkspaceContextType {
    cwd: string | null,
    setCwd: React.Dispatch<React.SetStateAction<string | null>>,
    files: FileInfo[],
    setFiles: React.Dispatch<React.SetStateAction<FileInfo[]>>,
    currentPath: string | null,
    setCurrentPath: React.Dispatch<React.SetStateAction<string | null>>,
    refresh: boolean,
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>,
    isTerminalOpen: boolean,
    setIsTerminalOpen: React.Dispatch<React.SetStateAction<boolean>>,
    sidePanel: boolean,
    setSidePanel: React.Dispatch<React.SetStateAction<boolean>>,
    currentActivity: string | null,
    setCurrentActivity: React.Dispatch<React.SetStateAction<string | null>>,
    toggleRefresh: () => void,
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export default WorkspaceContext

