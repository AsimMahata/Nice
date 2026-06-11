import React, { createContext } from "react";

interface WorkspaceContextType {
    cwd: string | null,
    setCwd: React.Dispatch<React.SetStateAction<string | null>>,
}
const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)


export default WorkspaceContext
