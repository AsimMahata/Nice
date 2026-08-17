import { useEditorContext } from "../../contexts/Editor/EditorProvider"
import { useWorkspaceContext } from "../../contexts/Workspace/WorkspaceProvider"
import { codeManager } from "./code.manager"
import { CodeRunnerParams } from "./code.options"

type Props = {
    openTerminal: () => void
}
//FIX:duing running code if compilation failed it runs run code anyway fix 
//FIX: after running cpp file or java files when clss or exe is generated the file explorer dont refresh

const CodeRunner = ({ openTerminal }: Props) => {
    //constexts
    const { cwd, setRefresh } = useWorkspaceContext()
    const { editorState, getDirtyStatus, codeLang } = useEditorContext()
    const handleRunCode = async () => {
        if (!editorState.activeFile) {
            console.error('please open some files to run')
            return
        }
        if (getDirtyStatus()) {
            console.error('not implemened save and run wait/codeRunner ---------------------')
            return
        }
        const openedFile = editorState.openedFiles[editorState.activeFile]
        const codeRunnerParams: CodeRunnerParams = {
            codeFile: openedFile.fileInfo,
            codeLang,
            cwd
        }
        console.log('------------codeManager time', codeRunnerParams, codeManager.time)
        try {
            openTerminal()
            setTimeout(async () => {
                await codeManager.runCode(codeRunnerParams);
            }, 30)

        } catch (err) {
            console.error('some error occured while calling run code in code manager', err)
        } finally {
            setRefresh(p => !p);
        }
    }
    return (
        <button
            onClick={handleRunCode}
            style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "#111",
                color: "#d1d5db",
                border: "1px solid #333",
                borderRadius: "4px",
                padding: "4px 10px",
                cursor: "pointer",
                fontSize: "12px",
                fontFamily: "inherit",
                transition: "transform 0.08s ease, background 0.08s ease",
            }}
            onMouseDown={(e) => {
                e.currentTarget.style.transform = "translateY(1px)";
            }}
            onMouseUp={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
            }}
        >
            ▶ Run
        </button>
    )
}

export default CodeRunner
