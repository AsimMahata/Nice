import { Group, GroupImperativeHandle, Panel, Separator } from "react-resizable-panels"
import { useEditorContext } from "../../../contexts/Editor/EditorProvider"
import { useWorkspaceContext } from "../../../contexts/Workspace/WorkspaceProvider"
import { useEffect, useRef } from "react"
import TabManager from "../../CodeEditor/TabManager"
import CodeEditor from "../../CodeEditor/CodeEditor"
import SettingsView from "../../Settings/SettingsView"
import { TerminalPanel } from "../../Terminal/TerminalPanel"
import Greeter from "../../Greeter/Greeter"


const MainBody = () => {
    const { editorState, codeLang } = useEditorContext()
    const { isTerminalOpen, setIsTerminalOpen } = useWorkspaceContext()
    const panelsGroupRef = useRef<GroupImperativeHandle | null>(null)

    // terminal cleanup from backend
    useEffect(() => {
        if (isTerminalOpen) {
            console.log("entered but returned from use useEffect in shell");
            return;
        }
        (async () => {
            try {
                await window.pty?.destroy();
                console.log("destroyed terminal from backend succesfully");
            } catch (err) {
                console.error("something error occured to destroy pty from backend", err);
            }
        })();

    }, [isTerminalOpen]);

    useEffect(() => {
        if (!panelsGroupRef.current) return
        const id = setTimeout(() => {
            panelsGroupRef.current?.setLayout(
                isTerminalOpen
                    ? { "editor-panel": 60, "terminal-panel": 40 }
                    : { "editor-panel": 100, "terminal-panel": 0 }
            )
        }, 20)
        return () => {
            clearTimeout(id)
        }
    }, [isTerminalOpen])

    return (
        <>
            {editorState.activeFile &&
                <main className="editor-container">
                    <TabManager />
                    <Group
                        orientation='vertical'
                        groupRef={panelsGroupRef}
                    >
                        <Panel id="editor-panel">
                            {editorState.activeFile === "nice://settings" ? (
                                <SettingsView />
                            ) : (
                                <CodeEditor key={codeLang} />
                            )}
                        </Panel>
                        <Separator className="resize-handle" />
                        <Panel
                            key={isTerminalOpen ? "open" : "closed"}
                            id="terminal-panel"
                            minSize={isTerminalOpen ? 30 : 0}
                            defaultSize={isTerminalOpen ? 30 : 0}
                            collapsible={!isTerminalOpen}
                        >
                            <TerminalPanel terminal={isTerminalOpen} setTerminal={setIsTerminalOpen} />
                        </Panel>
                    </Group>
                </main>
            }
            {
                !editorState.activeFile &&
                <Greeter />
            }
        </>
    )
}

export default MainBody
