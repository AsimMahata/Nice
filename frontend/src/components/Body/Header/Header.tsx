import { VenetianMask } from "lucide-react"
import { useEffect } from "react"
import { useEditorContext } from "../../../contexts/Editor/EditorProvider"
import { useWorkspaceContext } from "../../../contexts/Workspace/WorkspaceProvider"
import PickDir from "../../FileEx/PickDir"
import SaveButton from "../../Utility/SaveButton"
import CodeRunner from "../../CodeRunner/CodeRunner"
import SearchBox from "../Search/SearchBox"


const Header = () => {
    console.log('rendered Header')
    // contexts
    const { editorState, codeLang, getCurrentFileInfo, setCodeLang } = useEditorContext()
    const { setIsTerminalOpen } = useWorkspaceContext()

    useEffect(() => {
        async function setFileType() {
            const extension = getCurrentFileInfo()?.extension || "";
            const map: Record<string, string> = {
                ".cpp": "cpp",
                ".py": "python",
                ".java": "java",
                ".c": "c",
            };

            setCodeLang(map[extension] ?? "PlainText");
        }
        setFileType();
    }, [editorState.activeFile]);

    return (
        <>
            <header className="ide-header">
                <div className="header-left">
                    <div className="logo-section">
                        <VenetianMask size={18} strokeWidth={2.5} />
                        <span className="logo-text">Nice</span>
                    </div>
                    <nav className="nav-menu">
                        <PickDir text="Project" />
                        <span
                            className="nav-link OpenTerminal"
                            onClick={() => setIsTerminalOpen(true)}>
                            Terminal
                        </span>
                        <span
                            className="nav-link OpenTerminal"
                            onClick={() => setIsTerminalOpen(false)}>
                            Close
                        </span>
                        <span className="currentProgrammingLang">{codeLang}</span>
                    </nav>
                </div>
                <SearchBox />
                <div style={{ width: "80px" }} />
                <SaveButton />
                <CodeRunner openTerminal={() => setIsTerminalOpen(true)} />
            </header >
        </>
    )
}

export default Header
