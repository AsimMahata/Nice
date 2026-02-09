import { useState } from "react"
import { useWorkspaceContext } from "../../contexts/Workspace/WorkspaceProvider"


type Props = {
    text: string
}


const PickDir = ({ text: name }: Props) => {
    //useWorkspaceContext
    const { cwd, setCwd } = useWorkspaceContext()

    console.log('cwd', cwd)



    const [_loading, setLoading] = useState(false)
    async function selectProjectDirectory() {
        if (!window.fileSystem) {
            console.log('Electron fileSystem API not available. Are you running in Electron?');
            return;
        }
        setLoading(true)
        try {
            const result = await window.fileSystem.openFolderDialog();
            const gotDirectory = result?.filePaths[0] || result?.folderPath || ""
            if (!gotDirectory) {
                throw new Error('could not find a main directory')
            }
            setCwd(gotDirectory)
            console.log('frontend main dir set result', result, gotDirectory)
        } catch (err) {
            console.log('some error occured when try to open directory', err)
        } finally {
            setLoading(false)
        }
    }
    return (
        <div className='dir-picker'>
            {!cwd &&
                <button
                    className='open-dir-button'
                    onClick={selectProjectDirectory}
                >
                    Open A Folder {cwd}
                </button>
            }
            {cwd &&
                <button
                    className='change-dir-button nav-link'
                    onClick={selectProjectDirectory}
                >
                    {name}
                </button>
            }
        </div>

    )
}

export default PickDir
