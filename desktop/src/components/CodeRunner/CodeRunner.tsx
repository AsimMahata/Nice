import { useEffect } from "react"
import { useEditorContext } from "../../contexts/Editor/EditorProvider"
import { useWorkspaceContext } from "../../contexts/Workspace/WorkspaceProvider"
import { useSettingsContext } from "../../contexts/Settings/SettingsProvider"
import { codeManager } from "./code.manager"
import { CodeRunnerParams } from "./code.options"

type Props = {
    openTerminal: () => void
}

const CodeRunner = ({ openTerminal }: Props) => {
    const { cwd, setRefresh, setCurrentActivity, setSidePanel, setCodeActionResult, setIsCodeActionRunning } = useWorkspaceContext()
    const { editorState, getDirtyStatus, codeLang } = useEditorContext()
    const { settings } = useSettingsContext()

    useEffect(() => {
        codeManager.onBackendResult = (result) => {
            setCodeActionResult(result);
            setIsCodeActionRunning(false);
            setCurrentActivity("CodeAction");
            setSidePanel(true);
        };
        return () => {
            codeManager.onBackendResult = null;
        };
    }, [setCodeActionResult, setIsCodeActionRunning, setCurrentActivity, setSidePanel]);

    const handleRunCode = async () => {
        if (!editorState.activeFile) {
            console.error('please open some files to run')
            return
        }
        if (getDirtyStatus()) {
            console.error('save the file before running')
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
            const executionMode = settings.execution?.executionMode ?? 'auto';

            let useBackend = false;
            if (executionMode === 'online') {
                useBackend = true;
            } else if (executionMode === 'local') {
                useBackend = false;
            } else {
                const hasLocal = typeof window.runner?.probeCompiler === 'function'
                    ? await window.runner.probeCompiler(codeLang ?? '')
                    : true;
                useBackend = !hasLocal;
            }

            if (useBackend) {
                setIsCodeActionRunning(true);
                setCodeActionResult(null);
                setCurrentActivity("CodeAction");
                setSidePanel(true);
            } else {
                openTerminal()
            }

            setTimeout(async () => {
                await codeManager.runCode(codeRunnerParams);
            }, 30)

        } catch (err) {
            setIsCodeActionRunning(false);
            console.error('some error occurred while calling run code in code manager', err)
        } finally {
            setRefresh(p => !p);
        }
    }
    return (
        <button
            id="code-runner-btn"
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
