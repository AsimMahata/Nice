import { useEffect, useRef, useState } from "react";
import {
    FolderIcon,
    Search,
    Github,
    Terminal as TERMLOGO,
    Settings,
    User,
    Trophy,
} from "lucide-react";
import { useEditorContext } from "../../../contexts/Editor/EditorProvider";
import { useWorkspaceContext } from "../../../contexts/Workspace/WorkspaceProvider";
import FileEx from "../../FileEx/FileEx";
import UserDetails from "../../User/UserDetails";
import CphPanel from "../../CphPanel/CphPanel.tsx";

const ActivityBar = () => {
    // Destructure setEditorState to manage opening the Settings tab in the editor
    const { getCurrentFileInfo, setEditorState } = useEditorContext();
    const { sidePanel, setSidePanel, currentActivity, setCurrentActivity } = useWorkspaceContext();

    // Horizontal resizing state
    const [width, setWidth] = useState(320); // default width in pixels
    const containerRef = useRef<HTMLDivElement>(null);
    const isResizing = useRef(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const newWidth = e.clientX - rect.left;
        if (newWidth >= 220 && newWidth <= 800) {
            setWidth(newWidth);
        }
    };

    const handleMouseUp = () => {
        isResizing.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
    };

    // Clean up event listeners on unmount
    useEffect(() => {
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, []);

    const handleActivityClickEvent = (name: string) => {
        if (name === "Settings") {
            setEditorState((prev) => {
                const isSettingsOpen = prev.openTabs.includes("nice://settings");
                return {
                    ...prev,
                    openFiles: {
                        ...prev.openFiles,
                        "nice://settings": {
                            content: "",
                            isDirty: false,
                            fileInfo: {
                                name: "Settings",
                                path: "nice://settings",
                                isDirectory: false,
                                size: 0,
                                modifiedAt: new Date(),
                                extension: "",
                            }
                        }
                    },
                    openTabs: isSettingsOpen ? prev.openTabs : [...prev.openTabs, "nice://settings"],
                    activeFile: "nice://settings"
                };
            });
            setSidePanel(false); // Close the side panel when settings is selected
            return;
        }

        if (!name) setSidePanel(false);
        if (currentActivity === name) {
            setSidePanel((p) => !p);
            return;
        }
        setCurrentActivity(name);
        setSidePanel(true);
    };

    const ActivityIcon = ({ name, icon }: any) => (
        <div
            className={`activity-icon-btn ${currentActivity === name ? "active" : ""}`}
            onClick={() => handleActivityClickEvent(name)}>
            {icon}
        </div>
    );

    function getCorrectActivitybar() {
        switch (currentActivity) {
            case "FileEx":
                return <FileEx codeFile={getCurrentFileInfo()} />;
            case "Search":
                return <div> Search</div>;
            case "Github":
                return <div> Github</div>;
            case "CodeAction":
                return <div> CodeAction </div>;
            case "CPH":
                return <CphPanel />;
            case "User":
                return <UserDetails />;
            default:
                return null;
        }
    }

    return (
        <>
            <aside className="activity-bar">
                <div className="icon-stack">
                    <ActivityIcon name={"FileEx"} icon={<FolderIcon size={22} />} />
                    <ActivityIcon name={"Search"} icon={<Search size={22} />} />
                    <ActivityIcon name={"Github"} icon={<Github size={22} />} />
                    <ActivityIcon name={"CodeAction"} icon={<TERMLOGO size={22} />} />
                    <ActivityIcon name={"CPH"} icon={<Trophy size={22} />} />
                </div>
                <div className="icon-stack">
                    <ActivityIcon name={"User"} icon={<User size={22} />} />
                    <ActivityIcon name={"Settings"} icon={<Settings size={22} />} />
                </div>
            </aside>

            {sidePanel && (
                <div
                    ref={containerRef}
                    className="current-activity"
                    style={{ 
                        width: `${width}px`, 
                        position: "relative",
                        flexShrink: 0
                    }}
                >
                    {getCorrectActivitybar()}
                    <div 
                        className="sidebar-resize-handle"
                        onMouseDown={handleMouseDown}
                    />
                </div>
            )}
        </>
    );
};

export default ActivityBar;