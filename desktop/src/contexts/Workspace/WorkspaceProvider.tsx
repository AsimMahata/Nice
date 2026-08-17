import { ReactNode, useContext, useState } from "react"
import WorkspaceContext, { CodeActionResult } from "./WorkspaceContext";
import { FileInfo } from "../../services/FileSystem/file.options";


const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
    const [cwd, setCwd] = useState<string | null>(null)
    const [files, setFiles] = useState<FileInfo[]>([]);
    const [currentPath, setCurrentPath] = useState<string | null>(null)
    const [refresh, setRefresh] = useState(false);
    const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(false);
    const [sidePanel, setSidePanel] = useState<boolean>(false);
    const [currentActivity, setCurrentActivity] = useState<string | null>("FileEx");
    const [codeActionResult, setCodeActionResult] = useState<CodeActionResult | null>(null);
    const [isCodeActionRunning, setIsCodeActionRunning] = useState<boolean>(false);

    function toggleRefresh() {
        setRefresh(p => !p);
    }

    return (
        <WorkspaceContext.Provider value={{
            cwd,
            setCwd,
            files,
            setFiles,
            currentPath,
            setCurrentPath,
            refresh,
            setRefresh,
            isTerminalOpen,
            setIsTerminalOpen,
            sidePanel,
            setSidePanel,
            currentActivity,
            setCurrentActivity,
            toggleRefresh,
            codeActionResult,
            setCodeActionResult,
            isCodeActionRunning,
            setIsCodeActionRunning,
        }}>
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
