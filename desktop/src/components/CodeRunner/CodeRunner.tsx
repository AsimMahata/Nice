import { useEffect } from "react";
import { Play, Loader2 } from "lucide-react";
import { useEditorContext } from "../../contexts/Editor/EditorProvider";
import { useWorkspaceContext } from "../../contexts/Workspace/WorkspaceProvider";
import { useSettingsContext } from "../../contexts/Settings/SettingsProvider";
import { codeManager } from "./code.manager";
import { CodeRunnerParams } from "./code.options";

type Props = {
    openTerminal: () => void;
};

const CodeRunner = ({ openTerminal }: Props) => {
    const { cwd, setRefresh, setCurrentActivity, setSidePanel, setCodeActionResult, setIsCodeActionRunning, isCodeActionRunning } = useWorkspaceContext();
    const { editorState, getDirtyStatus, codeLang } = useEditorContext();
    const { settings } = useSettingsContext();

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
            console.error('please open some files to run');
            return;
        }
        if (getDirtyStatus()) {
            console.error('save the file before running');
            return;
        }
        const openedFile = editorState.openedFiles[editorState.activeFile];
        const codeRunnerParams: CodeRunnerParams = {
            codeFile: openedFile.fileInfo,
            codeLang,
            cwd
        };
        console.log('------------codeManager time', codeRunnerParams, codeManager.time);
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
                openTerminal();
            }

            setTimeout(async () => {
                await codeManager.runCode(codeRunnerParams);
            }, 30);

        } catch (err) {
            setIsCodeActionRunning(false);
            console.error('some error occurred while calling run code in code manager', err);
        } finally {
            setRefresh(p => !p);
        }
    };

    return (
        <button
            id="code-runner-btn"
            onClick={handleRunCode}
            disabled={isCodeActionRunning}
            title="Run Code"
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "linear-gradient(135deg, var(--accent-primary), var(--accent-primary-hover))",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "var(--radius-sm)",
                padding: "5px 12px",
                cursor: isCodeActionRunning ? "not-allowed" : "pointer",
                fontSize: "12px",
                fontWeight: 600,
                boxShadow: "0 2px 8px var(--accent-glow)",
                transition: "all 0.15s ease",
                opacity: isCodeActionRunning ? 0.7 : 1,
            }}
        >
            {isCodeActionRunning ? (
                <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Running…</span>
                </>
            ) : (
                <>
                    <Play size={13} fill="currentColor" />
                    <span>Run</span>
                </>
            )}
        </button>
    );
};

export default CodeRunner;
