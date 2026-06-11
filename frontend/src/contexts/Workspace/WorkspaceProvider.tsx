import { ReactNode, useContext, useState } from "react"
import WorkspaceContext from "./WorkspaceContext";


const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
    const [cwd, setCwd] = useState<string | null>(null)
    return (
        <WorkspaceContext.Provider value={{ cwd, setCwd }}>
            {children}
        </WorkspaceContext.Provider>
    )
}

export default WorkspaceProvider

export const useWorkspaceContext = () => {
    const context = useContext(WorkspaceContext)
    if (context === undefined) {
        throw new Error('WorkspaceContext not found!!');
    }
    return context;
}
