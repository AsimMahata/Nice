import { useWorkspaceContext } from "../../contexts/Workspace/WorkspaceProvider";
import { CodeActionResult, ExecutionStatus } from "../../contexts/Workspace/WorkspaceContext";
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

function LoadingState() {
    return (
        <div className="ca-loading">
            <div className="ca-spinner" />
            <span>Running via backend sandbox…</span>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="ca-empty">
            <div className="ca-empty-icon">▶</div>
            <p>Run your code to see results here.</p>
            <p className="ca-empty-sub">
                This panel opens automatically when the local compiler is not available
                and backend execution is used.
            </p>
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
    const { codeActionResult, isCodeActionRunning } = useWorkspaceContext();

    return (
        <div className="ca-panel" id="code-action-panel">
            <div className="ca-panel-title">
                <span className="ca-title-icon">▶</span>
                Code Action
            </div>

            {isCodeActionRunning && <LoadingState />}
            {!isCodeActionRunning && !codeActionResult && <EmptyState />}
            {!isCodeActionRunning && codeActionResult && <ResultView result={codeActionResult} />}
        </div>
    );
};

export default CodeActionPanel;
