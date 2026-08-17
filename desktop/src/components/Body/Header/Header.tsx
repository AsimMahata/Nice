import { Code2, SquareTerminal } from "lucide-react";
import { useEffect } from "react";
import { useEditorContext } from "../../../contexts/Editor/EditorProvider";
import { useWorkspaceContext } from "../../../contexts/Workspace/WorkspaceProvider";
import SaveButton from "../../Utility/SaveButton";
import CodeRunner from "../../CodeRunner/CodeRunner";
import CommandPalette from "../CommandPalette/CommandPalette";

const Header = () => {
    console.log('rendered Header');
    const { editorState, codeLang, getCurrentFileInfo, setCodeLang } = useEditorContext();
    const { setIsTerminalOpen, isTerminalOpen } = useWorkspaceContext();

    useEffect(() => {
        async function setFileType() {
            const extension = getCurrentFileInfo()?.extension || "";
            const map: Record<string, string> = {
                ".cpp": "cpp",
                ".cc": "cpp",
                ".c": "c",
                ".py": "python",
                ".java": "java",
                ".js": "javascript",
                ".ts": "typescript",
                ".tsx": "typescriptreact",
                ".jsx": "javascriptreact",
                ".json": "json",
                ".html": "html",
                ".css": "css",
            };

            setCodeLang(map[extension] ?? "PlainText");
        }
        setFileType();
    }, [editorState.activeFile]);

    return (
        <header className="ide-header">
            <div className="header-left">
                <div className="logo-section">
                    <span className="logo-icon">
                        <Code2 size={16} strokeWidth={2.5} />
                    </span>
                    <span className="logo-text">Nice</span>
                </div>
                <nav className="nav-menu">
                    <button
                        className={`nav-link ${isTerminalOpen ? 'active' : ''}`}
                        onClick={() => setIsTerminalOpen(prev => !prev)}
                        title="Toggle Terminal"
                    >
                        <SquareTerminal size={14} />
                        <span>Terminal</span>
                    </button>
                    {codeLang && codeLang !== "PlainText" && (
                        <span className="currentProgrammingLang">{codeLang}</span>
                    )}
                </nav>
            </div>

            <CommandPalette />

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <SaveButton />
                <CodeRunner openTerminal={() => setIsTerminalOpen(true)} />
            </div>
        </header>
    );
};

export default Header;
