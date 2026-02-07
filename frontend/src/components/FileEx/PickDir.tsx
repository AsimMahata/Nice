import { useState } from "react"


type Props = {
    text: string
    mainDir: string | null
    setMainDir: React.Dispatch<React.SetStateAction<string | null>>
}


const PickDir = ({ text: name, mainDir, setMainDir }: Props) => {
    const [_loading, setLoading] = useState(false)
    async function selectProjectDirectory() {
        if (!window.fileSystem) {
            console.log('Electron fileSystem API not available. Are you running in Electron?');
            return;
        }
        setLoading(true)
        try {
            const result = await window.fileSystem.openFolderDialog();
            const gotDirectory = result?.folderPath || ""
            setMainDir(gotDirectory)
            console.log('frontend resutl', result)
        } catch (err) {
            console.log('some error occured when try to open directory', err)
        } finally {
            setLoading(false)
        }
    }
    return (
        <div className='dir-picker'>
            {!mainDir &&
                <button
                    className='open-dir-button'
                    onClick={selectProjectDirectory}
                >
                    Open A Folder
                </button>
            }
            {mainDir &&
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
