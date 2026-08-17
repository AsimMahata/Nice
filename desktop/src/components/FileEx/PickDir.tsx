import { useState } from "react"
import { useWorkspaceContext } from "../../contexts/Workspace/WorkspaceProvider"
import { fileSystem } from "../../services/FileSystem/FileSystem"
import { FolderOpen } from "lucide-react"

type Props = {
    text?: string;
    className?: string;
}

const PickDir = ({ text = "Open Folder", className }: Props) => {
    const { cwd, setCwd } = useWorkspaceContext()
    const [_loading, setLoading] = useState(false)

    async function selectProjectDirectory() {
        if (!window.fileSystem) {
            console.log('Electron fileSystem API not available. Are you running in Electron?');
            return;
        }
        setLoading(true)
        try {
            const result = await fileSystem.openFolderSelector();
            const gotDirectory = result?.filePaths[0] || result?.folderPath || ""
            if (!gotDirectory) {
                return;
            }
            setCwd(gotDirectory)
        } catch (err) {
            console.log('some error occured when try to open directory', err)
        } finally {
            setLoading(false)
        }
    }

    const buttonLabel = cwd ? (text === "Open Folder" ? "Change Folder" : text) : "Open Folder";

    return (
        <div className={className || 'dir-picker'}>
            <button
                className="nav-link open-dir-button flex items-center gap-1.5"
                onClick={selectProjectDirectory}
                title="Open or Change Working Directory"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
                <FolderOpen size={14} />
                <span>{buttonLabel}</span>
            </button>
        </div>
    )
}

export default PickDir
