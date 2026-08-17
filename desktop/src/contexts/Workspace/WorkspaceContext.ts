import React, { createContext } from "react";
import { FileInfo } from "../../services/FileSystem/file.options";

export type ExecutionStatus =
    | 'Accepted'
    | 'Compilation Error'
    | 'Runtime Error'
    | 'Time Limit Exceeded'
    | 'Memory Limit Exceeded'
    | 'Sandbox Error';

export interface CodeActionResult {
    success: boolean;
    compilationSuccess: boolean;
    stdout: string;
    stderr: string;
    compilationError: string;
    exitCode: number | null;
    executionTimeMs: number;
    memoryUsageKb: number | null;
    status: ExecutionStatus;
    source: 'local' | 'backend';
}

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
    codeActionResult: CodeActionResult | null,
    setCodeActionResult: React.Dispatch<React.SetStateAction<CodeActionResult | null>>,
    isCodeActionRunning: boolean,
    setIsCodeActionRunning: React.Dispatch<React.SetStateAction<boolean>>,
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export default WorkspaceContext
