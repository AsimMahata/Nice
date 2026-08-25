import { useEffect, useRef } from "react";
import { Play, Loader2 } from "lucide-react";
import { useEditorContext } from "../../contexts/Editor/EditorProvider";
import { useWorkspaceContext } from "../../contexts/Workspace/WorkspaceProvider";
import { useCodeActionContext } from "../../contexts/CodeAction/CodeActionProvider";
import { useSettingsContext } from "../../contexts/Settings/SettingsProvider";
import { codeManager } from "./code.manager";
import { CodeRunnerParams, getRunnableLanguage } from "./code.options";

type Props = {
    openTerminal: () => void;
};

const CodeRunner = ({ openTerminal }: Props) => {
    const { cwd, setRefresh, setCurrentActivity, setSidePanel } = useWorkspaceContext();
    const {
        setCodeActionResult,
        isCodeActionRunning,
        setIsCodeActionRunning,
        runningFilePath,
        setRunningFilePath,
        codeActionInput,
    } = useCodeActionContext();
    const { editorState, getDirtyStatus, codeLang, saveActiveFile } = useEditorContext();
    const { settings } = useSettingsContext();

    const activeFileRef = useRef(editorState.activeFile);
    activeFileRef.current = editorState.activeFile;

    const openedTabsRef = useRef(editorState.openedTabs);
    openedTabsRef.current = editorState.openedTabs;

    useEffect(() => {
        codeManager.onBackendResult = (result, filePath) => {
            // Update result and open panel if the file is still open
            if (openedTabsRef.current.includes(filePath)) {
                setCodeActionResult(result);
                if (activeFileRef.current === filePath) {
                    setCurrentActivity("CodeAction");
                    setSidePanel(true);
                }
            }
            setRunningFilePath((current) => (current === filePath ? null : current));
            setIsCodeActionRunning(false);
        };
        return () => {
            codeManager.onBackendResult = null;
        };
    }, [setCodeActionResult, setIsCodeActionRunning, setRunningFilePath, setCurrentActivity, setSidePanel]);

    const activeFile = editorState.activeFile;
    const openedFile = activeFile ? editorState.openedFiles[activeFile] : null;
    const runnableLang = getRunnableLanguage(openedFile?.fileInfo, codeLang);
    const isRunnable = Boolean(runnableLang);

    // Is the currently active tab the one that is running?
    const isThisFileRunning = Boolean(isCodeActionRunning && runningFilePath === activeFile);

    const handleRunCode = async () => {
        // Prevent concurrent execution while any run is active
        if (isCodeActionRunning) {
            console.warn("Execution already in progress. Please wait for it to complete.");
            return;
        }

        if (!activeFile) {
            console.warn("Please open a file to run");
            return;
        }

        if (activeFile.startsWith("nice://")) {
            console.warn(`Cannot run code: "${openedFile?.fileInfo.name || activeFile}" is a built-in page.`);
            return;
        }

        if (!openedFile) return;

        if (!runnableLang) {
            console.warn(`Cannot run code: Unsupported file extension "${openedFile.fileInfo.extension}". Supported languages: C, C++, Java, Python.`);
            return;
        }

        if (getDirtyStatus()) {
            await saveActiveFile();
        }

        const currentTargetFile = activeFile;
        const codeRunnerParams: CodeRunnerParams = {
            codeFile: openedFile.fileInfo,
            codeLang: runnableLang,
            cwd,
            input: codeActionInput,
        };

        console.log("------------codeManager time", codeRunnerParams, codeManager.time);

        try {
            const executionMode = settings.execution?.executionMode ?? "auto";

            let useBackend = false;
            if (executionMode === "online") {
                useBackend = true;
            } else if (executionMode === "local") {
                useBackend = false;
            } else {
                const hasLocal = typeof window.runner?.probeCompiler === "function"
                    ? await window.runner.probeCompiler(runnableLang)
                    : true;
                useBackend = !hasLocal;
            }

            setRunningFilePath(currentTargetFile);
            setIsCodeActionRunning(true);

            if (useBackend) {
                setCodeActionResult(null);
                setCurrentActivity("CodeAction");
                setSidePanel(true);
            } else {
                openTerminal();
            }

            await codeManager.runCode(codeRunnerParams);
        } catch (err: any) {
            console.error("Error occurred while calling run code in code manager:", err);
        } finally {
            // Clean up state only when execution completes naturally
            setRunningFilePath((current) => (current === currentTargetFile ? null : current));
            setIsCodeActionRunning(false);
            setRefresh((p) => !p);
        }
    };

    const getTooltip = () => {
        if (isThisFileRunning) return "Running code…";
        if (isCodeActionRunning) return "Another execution is in progress… Please wait until it completes.";
        if (!activeFile) return "Open a file to run";
        if (activeFile.startsWith("nice://")) return `Cannot run ${openedFile?.fileInfo.name || "settings"} page`;
        if (!isRunnable) return `Cannot run ${openedFile?.fileInfo.extension || "this file"} (Supported: C, C++, Java, Python)`;
        return `Run ${runnableLang ? runnableLang.toUpperCase() : "Code"}`;
    };

    return (
        <button
            id="code-runner-btn"
            onClick={handleRunCode}
            disabled={isCodeActionRunning || !isRunnable}
            title={getTooltip()}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: !isRunnable || (isCodeActionRunning && !isThisFileRunning)
                    ? "var(--bg-tertiary, #2a2d32)"
                    : "linear-gradient(135deg, var(--accent-primary), var(--accent-primary-hover))",
                color: !isRunnable || (isCodeActionRunning && !isThisFileRunning) ? "var(--text-muted, #888888)" : "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "var(--radius-sm)",
                padding: "5px 12px",
                cursor: isCodeActionRunning || !isRunnable ? "not-allowed" : "pointer",
                fontSize: "12px",
                fontWeight: 600,
                boxShadow: isRunnable && !isCodeActionRunning ? "0 2px 8px var(--accent-glow)" : "none",
                transition: "all 0.15s ease",
                opacity: isCodeActionRunning ? (isThisFileRunning ? 0.85 : 0.5) : !isRunnable ? 0.5 : 1,
            }}
        >
            {isThisFileRunning ? (
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
