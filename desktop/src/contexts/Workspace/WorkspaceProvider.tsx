import { ReactNode, useContext, useState } from "react"
import WorkspaceContext, { CodeActionResult } from "./WorkspaceContext";
import { FileInfo } from "../../services/FileSystem/file.options";


const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
    const [cwd, setCwdState] = useState<string | null>(() => {
        try {
            const savedCwd = localStorage.getItem("nice_last_cwd");
            if (savedCwd && savedCwd.trim()) {
                return savedCwd.trim();
            }
        } catch (err) {
            console.error("Failed to read last opened directory from localStorage", err);
        }

        // In dev mode only: fallback to VITE_TESTING_FOLDER if present
        if (import.meta.env.DEV && import.meta.env.VITE_TESTING_FOLDER) {
            return import.meta.env.VITE_TESTING_FOLDER;
        }

        return null;
    });

    const setCwd = (dir: string | null | ((prev: string | null) => string | null)) => {
        setCwdState(prev => {
            const nextCwd = typeof dir === 'function' ? dir(prev) : dir;
            try {
                if (nextCwd) {
                    localStorage.setItem("nice_last_cwd", nextCwd);
                } else {
                    localStorage.removeItem("nice_last_cwd");
                }
            } catch (err) {
                console.error("Failed to save opened directory to localStorage", err);
            }
            return nextCwd;
        });
    };
    const [files, setFiles] = useState<FileInfo[]>([]);
    const [currentPath, setCurrentPath] = useState<string | null>(null)
    const [refresh, setRefresh] = useState(false);
    const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(false);
    const [sidePanel, setSidePanel] = useState<boolean>(false);
    const [currentActivity, setCurrentActivity] = useState<string | null>("FileEx");

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
