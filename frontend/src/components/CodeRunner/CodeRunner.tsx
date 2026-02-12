import { useEditorContext } from "../../contexts/Editor/EditorProvider"
import { useWorkspaceContext } from "../../contexts/Workspace/WorkspaceProvider"
import { codeManager } from "./code.manager"
import { CodeRunnerParams } from "./code.options"

type Props = {
    openTerminal: () => void
}

const CodeRunner = ({ openTerminal }: Props) => {
    //constexts
    const { cwd, openedFiles, openedFileIndex } = useWorkspaceContext()
    const { codeLang, isDirty } = useEditorContext()
    const handleRunCode = async () => {
        if (!openedFiles.length) {
            console.error('please open some files to run')
            return
        }
        if (isDirty) {
            console.error('not implemened save and run wait')
            return
        }
        const index = openedFileIndex ?? 0
        const activeFile = openedFiles[index]
        const codeRunnerParams: CodeRunnerParams = {
            codeFile: activeFile,
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
