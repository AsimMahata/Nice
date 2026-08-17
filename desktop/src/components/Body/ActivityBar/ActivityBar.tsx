import { useEffect, useRef, useState } from "react";
import {
    FolderIcon,
    Terminal as TERMLOGO,
    Settings,
    User,
    Trophy,
} from "lucide-react";
import { useEditorContext } from "../../../contexts/Editor/EditorProvider";
import { useWorkspaceContext } from "../../../contexts/Workspace/WorkspaceProvider";
import FileEx from "../../FileEx/FileEx";
import CphPanel from "../../CphPanel/CphPanel.tsx";
import CodeActionPanel from "../../CodeActionPanels/CodeActionPanel";
import { useAuth } from "../../../utils/useAuth";
import { useNavigate } from "react-router-dom";

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

    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleActivityClickEvent = (name: string) => {
        if (name === "Settings") {
            setEditorState((prev) => {
                const isSettingsOpen = prev.openedTabs.includes("nice://settings");
                return {
                    ...prev,
                    openedFiles: {
                        ...prev.openedFiles,
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
                    openedTabs: isSettingsOpen ? prev.openedTabs : [...prev.openedTabs, "nice://settings"],
                    activeFile: "nice://settings"
                };
            });
            setSidePanel(false); // Close the side panel when settings is selected
            return;
        }

        if (name === "User") {
            if (isAuthenticated && user) {
                setEditorState((prev) => {
                    const isProfileOpen = prev.openedTabs.includes("nice://profile");
                    return {
                        ...prev,
                        openedFiles: {
                            ...prev.openedFiles,
                            "nice://profile": {
                                content: "",
                                isDirty: false,
                                fileInfo: {
                                    name: "Profile",
                                    path: "nice://profile",
                                    isDirectory: false,
                                    size: 0,
                                    modifiedAt: new Date(),
                                    extension: "",
                                }
                            }
                        },
                        openedTabs: isProfileOpen ? prev.openedTabs : [...prev.openedTabs, "nice://profile"],
                        activeFile: "nice://profile"
                    };
                });
            } else {
                navigate('/login');
            }
            setSidePanel(false);
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

    const ActivityIcon = ({ name, title, icon }: { name: string; title: string; icon: React.ReactNode }) => (
        <div
            className={`activity-icon-btn ${currentActivity === name && sidePanel ? "active" : ""}`}
            title={title}
            onClick={() => handleActivityClickEvent(name)}>
            {icon}
        </div>
    );

    function getCorrectActivitybar() {
        switch (currentActivity) {
            case "FileEx":
                return <FileEx codeFile={getCurrentFileInfo()} />;
            case "CodeAction":
                return <CodeActionPanel />;
            case "CPH":
                return <CphPanel />;
            default:
                return null;
        }
    }

    return (
        <>
            <aside className="activity-bar">
                <div className="icon-stack">
                    <ActivityIcon name={"FileEx"} title="Explorer (Files & Folders)" icon={<FolderIcon size={20} />} />
                    <ActivityIcon name={"CodeAction"} title="Code Action & Execution" icon={<TERMLOGO size={20} />} />
                    <ActivityIcon name={"CPH"} title="Competitive Programming Helper" icon={<Trophy size={20} />} />
                </div>
                <div className="icon-stack">
                    <ActivityIcon name={"User"} title="User Profile" icon={<User size={20} />} />
                    <ActivityIcon name={"Settings"} title="Settings" icon={<Settings size={20} />} />
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
