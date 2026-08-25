import React, { createContext } from "react";

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

export interface CodeActionContextType {
    codeActionResult: CodeActionResult | null;
    setCodeActionResult: React.Dispatch<React.SetStateAction<CodeActionResult | null>>;
    isCodeActionRunning: boolean;
    setIsCodeActionRunning: React.Dispatch<React.SetStateAction<boolean>>;
    codeActionInput: string;
    setCodeActionInput: React.Dispatch<React.SetStateAction<string>>;
}

const CodeActionContext = createContext<CodeActionContextType | undefined>(undefined);

export default CodeActionContext;
