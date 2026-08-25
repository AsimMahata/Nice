import { useRef } from "react";
import { Play, Loader2 } from "lucide-react";
import { useCodeActionContext } from "../../contexts/CodeAction/CodeActionProvider";
import { useEditorContext } from "../../contexts/Editor/EditorProvider";
import { useWorkspaceContext } from "../../contexts/Workspace/WorkspaceProvider";
import { CodeActionResult, ExecutionStatus } from "../../contexts/CodeAction/CodeActionContext";
import { codeManager } from "../CodeRunner/code.manager";
import { getRunnableLanguage } from "../CodeRunner/code.options";
import "./CodeActionPanel.css";

const statusConfig: Record<ExecutionStatus, { label: string; className: string }> = {
    'Accepted': { label: '✓ Accepted', className: 'status-accepted' },
    'Compilation Error': { label: '✗ Compilation Error', className: 'status-error' },
    'Runtime Error': { label: '✗ Runtime Error', className: 'status-error' },
    'Time Limit Exceeded': { label: '⏱ Time Limit Exceeded', className: 'status-warning' },
    'Memory Limit Exceeded': { label: '⚠ Memory Limit Exceeded', className: 'status-warning' },
    'Sandbox Error': { label: '⚙ Sandbox Error', className: 'status-neutral' },
};

function StatusBadge({ status }: { status: ExecutionStatus }) {
    const cfg = statusConfig[status] ?? { label: status, className: 'status-neutral' };
    return <span className={`ca-badge ca-status-badge ${cfg.className}`}>{cfg.label}</span>;
}

function SourceBadge({ source }: { source: 'local' | 'backend' }) {
    return (
        <span className={`ca-badge ca-source-badge ${source === 'backend' ? 'source-backend' : 'source-local'}`}>
            {source === 'backend' ? '☁ Backend' : '⚡ Local'}
        </span>
    );
}

function CodeBlock({ label, content, placeholder }: { label: string; content: string; placeholder: string }) {
    return (
        <div className="ca-section">
            <div className="ca-section-label">{label}</div>
            <div className="ca-code-block">
                {content
                    ? <pre className="ca-pre">{content}</pre>
                    : <span className="ca-placeholder">{placeholder}</span>
                }
            </div>
        </div>
    );
}

function LoadingState({ message = "Running code via sandbox…" }: { message?: string }) {
    return (
        <div className="ca-loading">
            <div className="ca-spinner" />
            <span>{message}</span>
        </div>
    );
}

function EmptyState({ onRun, disabled }: { onRun?: () => void; disabled?: boolean }) {
    return (
        <div className="ca-empty">
            <div className="ca-empty-icon">▶</div>
            <p>Run your code to see results here.</p>
            <p className="ca-empty-sub">
                Enter your test input above and click <strong>Run Code</strong> or press <kbd className="ca-kbd">Ctrl+Enter</kbd>.
            </p>
            {onRun && (
                <button
                    className="ca-empty-run-btn"
                    onClick={onRun}
                    disabled={disabled}
                >
                    <Play size={13} fill="currentColor" />
                    <span>Run Now</span>
                </button>
            )}
        </div>
    );
}

function ResultView({ result }: { result: CodeActionResult }) {
    return (
        <div className="ca-result">
            <div className="ca-header-row">
                <StatusBadge status={result.status} />
                <SourceBadge source={result.source} />
            </div>

            <div className="ca-stats">
                <span>⏱ {result.executionTimeMs}ms</span>
                {result.memoryUsageKb != null && (
                    <span>💾 {result.memoryUsageKb.toLocaleString()} KB</span>
                )}
                {result.exitCode != null && (
                    <span>Exit: {result.exitCode}</span>
                )}
            </div>

            {!result.compilationSuccess && result.compilationError && (
                <CodeBlock
                    label="COMPILATION ERROR"
                    content={result.compilationError}
                    placeholder=""
                />
            )}

            {result.compilationSuccess && (
                <CodeBlock
                    label="OUTPUT"
                    content={result.stdout}
                    placeholder="(no output)"
                />
            )}

            {result.stderr && (
                <CodeBlock
                    label="STDERR"
                    content={result.stderr}
                    placeholder=""
                />
            )}
        </div>
    );
}

const CodeActionPanel = () => {
    const {
        codeActionResult,
        setCodeActionResult,
        isCodeActionRunning,
        setIsCodeActionRunning,
        runningFilePath,
        setRunningFilePath,
        codeActionInput,
        setCodeActionInput,
    } = useCodeActionContext();
    const { editorState, getDirtyStatus, codeLang, buffersRef, saveActiveFile } = useEditorContext();
    const { cwd } = useWorkspaceContext();

    const activeFile = editorState.activeFile;
    const openedFile = activeFile ? editorState.openedFiles[activeFile] : null;
    const runnableLang = getRunnableLanguage(openedFile?.fileInfo, codeLang);

    const openedTabsRef = useRef(editorState.openedTabs);
    openedTabsRef.current = editorState.openedTabs;

    const isThisFileRunning = Boolean(isCodeActionRunning && runningFilePath === activeFile);

    const handleRun = async () => {
        // Prevent concurrent requests while an execution is in-flight
        if (isCodeActionRunning) {
            console.warn("Execution already in progress. Please wait for it to complete.");
            return;
        }

        if (!activeFile) {
            console.warn("Please open a file first to run");
            return;
        }

        if (activeFile.startsWith("nice://")) {
            console.warn(`Cannot run code: "${openedFile?.fileInfo.name || activeFile}" is a built-in page.`);
            return;
        }

        if (!openedFile) return;

        if (!runnableLang) {
            setCodeActionResult({
                success: false,
                compilationSuccess: false,
                stdout: "",
                stderr: `Cannot run "${openedFile.fileInfo.name}": Unsupported file extension "${openedFile.fileInfo.extension}". Supported languages: C, C++, Java, Python.`,
                compilationError: "",
                exitCode: null,
                executionTimeMs: 0,
                memoryUsageKb: null,
                status: "Sandbox Error",
                source: "backend",
            });
            return;
        }

        if (getDirtyStatus()) {
            await saveActiveFile();
        }

        const currentTargetFile = activeFile;
        setRunningFilePath(currentTargetFile);
        setIsCodeActionRunning(true);
        setCodeActionResult(null);

        try {
            const fileInfo = openedFile.fileInfo;
            const code = buffersRef.current[activeFile] || "";

            if (window.runner?.runCodeBackend) {
                const response = await window.runner.runCodeBackend({
                    filePath: fileInfo.path,
                    language: runnableLang,
                    code,
                    input: codeActionInput ?? '',
                });
                if (openedTabsRef.current.includes(currentTargetFile)) {
                    if (response?.result) {
                        setCodeActionResult(response.result);
                    } else if (response) {
                        setCodeActionResult(response);
                    }
                }
            } else {
                await codeManager.runCode({
                    codeFile: fileInfo,
                    codeLang: runnableLang,
                    cwd,
                    input: codeActionInput ?? '',
                });
            }
        } catch (err: any) {
            console.error("CodeAction execution error:", err);
            if (openedTabsRef.current.includes(currentTargetFile)) {
                setCodeActionResult({
                    success: false,
                    compilationSuccess: false,
                    stdout: "",
                    stderr: err?.message || String(err),
                    compilationError: "",
                    exitCode: null,
                    executionTimeMs: 0,
                    memoryUsageKb: null,
                    status: "Sandbox Error",
                    source: "backend",
                });
            }
        } finally {
            setRunningFilePath((current) => (current === currentTargetFile ? null : current));
            setIsCodeActionRunning(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            if (!isCodeActionRunning) {
                handleRun();
            }
        }
    };

    return (
        <div className="ca-panel" id="code-action-panel">
            <div className="ca-panel-title">
                <div className="ca-title-left">
                    <span className="ca-title-icon">▶</span>
                    <span>Code Action</span>
                </div>
                <button
                    className="ca-run-btn"
                    onClick={handleRun}
                    disabled={isCodeActionRunning || !editorState.activeFile || !runnableLang}
                    title={isCodeActionRunning ? "Execution in progress… Please wait." : "Run Code with Input (Ctrl+Enter)"}
                >
                    {isThisFileRunning ? (
                        <>
                            <Loader2 size={12} className="ca-spin" />
                            <span>Running…</span>
                        </>
                    ) : (
                        <>
                            <Play size={12} fill="currentColor" />
                            <span>Run</span>
                        </>
                    )}
                </button>
            </div>

            <div className="ca-section ca-input-section">
                <div className="ca-input-header">
                    <span className="ca-section-label">Input</span>
                    <span className="ca-input-hint">Ctrl+Enter to run</span>
                </div>
                <textarea
                    className="ca-input-textarea"
                    placeholder="Enter input for stdin here..."
                    value={codeActionInput}
                    onChange={(e) => setCodeActionInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={3}
                />
            </div>

            {isThisFileRunning && <LoadingState />}
            {isCodeActionRunning && !isThisFileRunning && <LoadingState message="Another execution is in progress… Please wait." />}
            {!isCodeActionRunning && !codeActionResult && (
                <EmptyState onRun={handleRun} disabled={isCodeActionRunning || !editorState.activeFile || !runnableLang} />
            )}
            {!isCodeActionRunning && codeActionResult && <ResultView result={codeActionResult} />}
        </div>
    );
};

export default CodeActionPanel;
