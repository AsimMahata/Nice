import {
    FolderIcon,
    Search,
    Github,
    Terminal as TERMLOGO,
    Settings,
    User,
    Command,
    VenetianMask,
} from "lucide-react";
import CodeEditor from "../../components/CodeEditor/CodeEditor";
import FileEx from "../../components/FileEx/FileEx";
import { useEffect, useState, useRef } from "react";

import "./Home.css"; // Import the new CSS file
import PickDir from "../../components/FileEx/PickDir";
import UserDetails from "../../components/User/UserDetails";
import { Group, GroupImperativeHandle, Panel, Separator } from "react-resizable-panels";
import { TerminalPanel } from "../../components/Terminal/TerminalPanel";

import { useFileActions } from "../../components/FileEx/FileActions";
import { useSocket } from "../../utils/useSocket";
import { useWorkspaceContext } from "../../contexts/Workspace/WorkspaceProvider";
import { useEditorContext } from "../../contexts/Editor/EditorProvider";
import CodeRunner from "../../components/CodeRunner/CodeRunner";
import SaveButton from "../../components/Utility/SaveButton";
import Greeter from "../../components/Greeter/Greeter";
import TabManager from "../../components/CodeEditor/TabManager";

function Home() {
    //contexts
    const { setCwd } = useWorkspaceContext()
    const { editorState, codeLang, setCodeLang, getCurrentFileInfo } = useEditorContext()
    const panelsGroupRef = useRef<GroupImperativeHandle | null>(null)

    const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(false); // this tells if terminal is available or active
    const [sidePanel, setSidePanle] = useState<boolean>(false); // is side panel visible or not
    const [currentActivity, setCurrentActivity] = useState<string | null>(
        "file-ex",
    ); // what is the current active button on side panel
    const [savingCode, setSavingCode] = useState<boolean>(false);
    const [isDev, _setAsim] = useState(true);


    const handleActivityClickEvent = (name: string) => {
        if (!name) setSidePanle(false);
        if (currentActivity == name) {
            console.log(
                "frontend/home/handleActivityClickEvent/ to check its already active ",
            );
            setSidePanle((p) => !p);
            return;
        }
        setCurrentActivity(name);
        setSidePanle(true);
        console.log("current active section in frontend home ", name);
    };
    const ActivityIcon = ({ name, icon }: any) => (
        <div
            className={`activity-icon-btn ${currentActivity == name ? "active" : ""}`}
            onClick={() => handleActivityClickEvent(name)}>
            {icon}
        </div>
    );


    function getCorrectActivitybar() {
        switch (currentActivity) {
            case "FileEx":
                return (
                    <FileEx
                        codeFile={getCurrentFileInfo()}
                        savingCode={savingCode}
                        setSavingCode={setSavingCode}
                    />
                );
            case "Search":
                return <div> Search</div>;
            case "Github":
                return <div> Github</div>;
            case "CodeAction":
                return <div> CodeAction </div>;
            case "User":
                return <UserDetails />;
            case "Settings":
                return <div> Settings</div>;
            default:
                return null;
        }
    }

    useEffect(() => {
        if (isDev) setCwd(import.meta.env.VITE_TESTING_FOLDER);
    }, []);

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
                console.error("something error occured to destroy pty from backend");
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
    const FileActions = useFileActions()

    const socket = useSocket();

    const handleCPHProblem = async (data: any) => {
        const formattedName = data.name
            .replace(/[.\s]/g, "_") // Replaces '.' and ' ' with '_'
            .replace(/_+/g, "_") // Collapses consecutive '_' into one
            .replace(/^_|_$/g, ""); // Removes leading/trailing underscores

        const filename = `${formattedName}.cpp`;
        try {
            await FileActions.createNewFiles(filename);
            console.log('FileActions.currentPath from home ---', FileActions.currentPath);
            // FileActions.setCurrentPath()
            // need to open file and than set lang so that it loads placeholder by useEffect
        } catch (error) {
            console.error(error);
        }
        console.log("created file and now ......");
    };

    useEffect(() => {
        socket.on("cph_problem", (data: any) => {
            console.log("New Problem:", data.name);
            handleCPHProblem(data);
        });
        return () => {
            socket.off("cph_problem");
        };
    }, [FileActions]);


    return (
        <div className="ide-container">
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

                <div className="search-wrapper">
                    <Command size={14} className="search-icon" color="#585b70" />
                    <input className="search-input" placeholder="Quick search..." />
                </div>
                <div style={{ width: "80px" }} />
                <SaveButton />
                <CodeRunner openTerminal={() => setIsTerminalOpen(true)} />
            </header >

            <div className="main-body">
                <aside className="activity-bar">
                    <div className="icon-stack">
                        <ActivityIcon name={"FileEx"} icon={<FolderIcon size={22} />} />
                        <ActivityIcon name={"Search"} icon={<Search size={22} />} />
                        <ActivityIcon name={"Github"} icon={<Github size={22} />} />
                        <ActivityIcon name={"CodeAction"} icon={<TERMLOGO size={22} />} />
                    </div>
                    <div className="icon-stack">
                        <ActivityIcon name={"User"} icon={<User size={22} />} />
                        <ActivityIcon name={"Settings"} icon={<Settings size={22} />} />
                    </div>
                </aside>
                <div
                    className="current-activity"
                    style={{ display: (sidePanel ? "block" : "none"), minWidth: "40vh" }}>
                    {getCorrectActivitybar()}
                </div>
                {editorState.activeFile &&
                    <main className="editor-container">
                        <TabManager />
                        <Group
                            orientation='vertical'
                            groupRef={panelsGroupRef}
                        >
                            <Panel id="editor-panel">
                                <CodeEditor key={codeLang} />
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
            </div>
        </div >
    );
}

export default Home;
