import { useEffect } from "react";
import { Play, Loader2 } from "lucide-react";
import { useEditorContext } from "../../contexts/Editor/EditorProvider";
import { useWorkspaceContext } from "../../contexts/Workspace/WorkspaceProvider";
import { useCodeActionContext } from "../../contexts/CodeAction/CodeActionProvider";
import { useSettingsContext } from "../../contexts/Settings/SettingsProvider";
import { codeManager } from "./code.manager";
import { CodeRunnerParams } from "./code.options";

type Props = {
    openTerminal: () => void;
};

const CodeRunner = ({ openTerminal }: Props) => {
    const { cwd, setRefresh, setCurrentActivity, setSidePanel } = useWorkspaceContext();
    const { codeActionResult, setCodeActionResult, isCodeActionRunning, setIsCodeActionRunning, codeActionInput } = useCodeActionContext();
    const { editorState, getDirtyStatus, codeLang, saveActiveFile } = useEditorContext();
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
            await saveActiveFile();
        }
        const openedFile = editorState.openedFiles[editorState.activeFile];
        if (!openedFile) return;

        const extToLang: Record<string, string> = {
            '.cpp': 'cpp', '.cc': 'cpp', '.cxx': 'cpp',
            '.c': 'c', '.py': 'python', '.java': 'java',
            '.js': 'javascript', '.ts': 'typescript',
        };
        const resolvedLang = (codeLang && codeLang !== 'PlainText')
            ? codeLang
            : (extToLang[openedFile.fileInfo.extension?.toLowerCase() ?? ''] || 'cpp');

        const codeRunnerParams: CodeRunnerParams = {
            codeFile: openedFile.fileInfo,
            codeLang: resolvedLang,
            cwd,
            input: codeActionInput,
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
                    ? await window.runner.probeCompiler(resolvedLang)
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
            }, 60);

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
