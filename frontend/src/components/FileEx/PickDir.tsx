import { open } from '@tauri-apps/plugin-dialog';


type Props = {
  mainDir: string | null,
  setMainDir: React.Dispatch<React.SetStateAction<string | null>>
}


const PickDir = ({ mainDir, setMainDir }: Props) => {
  async function selectProjectDirectory() {
    try {
      const projectPath = await open({
        directory: true,
        multiple: false,
        title: 'Select Project Folder',
      });
      if (projectPath) {
        setMainDir(projectPath)
      }
      console.log('selected main project Folder', projectPath)
    } catch (err) {
      console.log('pick dir err', err)
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
          className='change-dir-button'
          onClick={selectProjectDirectory}
        >
          Change
        </button>
      }
    </div>

  )
}

export default PickDir
