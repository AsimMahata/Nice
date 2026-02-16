import { ReactNode, useContext, useState } from "react"
import { FileInfo } from "../../components/FileEx/FileActions";
import WorkspaceContext from "./WorkspaceContext";


const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
    const [cwd, setCwd] = useState<string | null>(null)
    const [openedFiles, setOpenedFiles] = useState<FileInfo[]>([])
    const [openedFileIndex, setOpenedFileIndex] = useState<number | null>(null)
    return (
        <WorkspaceContext.Provider value={{ cwd, setCwd, openedFiles, setOpenedFiles, openedFileIndex, setOpenedFileIndex }}>
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
