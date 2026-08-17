import React, { useState, useEffect } from "react";
import { X, Settings, User, FileCode, FileText, Code2, ArrowRight, ArrowLeft, XCircle, MinusCircle } from "lucide-react";
import { useEditorContext } from "../../contexts/Editor/EditorProvider";
import { useSettingsContext } from "../../contexts/Settings/SettingsProvider";
import { notify } from "../../utils/notification";
import { fileSystem } from "../../services/FileSystem/FileSystem";

interface TabProps {
    path: string;
    name: string;
    active: boolean;
    isDirty: boolean;
    onClose: (path: string) => void;
    onClick: (path: string) => void;
    onContextMenu: (e: React.MouseEvent, path: string) => void;
}

const getTabIcon = (path: string) => {
    if (path === "nice://settings") return <Settings size={13} style={{ color: "var(--accent-light)", flexShrink: 0 }} />;
    if (path === "nice://profile") return <User size={13} style={{ color: "var(--status-info)", flexShrink: 0 }} />;
    if (path === "nice://codeforces") return <Code2 size={13} style={{ color: "#ef4444", flexShrink: 0 }} />;
    if (path.endsWith(".json") || path.endsWith(".md") || path.endsWith(".txt")) {
        return <FileText size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />;
    }
    return <FileCode size={13} style={{ color: "var(--accent-light)", flexShrink: 0 }} />;
};

const Tab = ({ path, name, active, isDirty, onClose, onClick, onContextMenu }: TabProps) => (
    <div
        className={`tab-item ${active ? "active" : ""}`}
        onClick={() => onClick(path)}
        onContextMenu={(e) => onContextMenu(e, path)}
        title={path}
    >
        {getTabIcon(path)}
        <span>{name}</span>
        {isDirty && <span className="tab-dirty-dot" title="Unsaved changes" />}
        <X
            size={13}
            className="close-icon"
            onClick={(e) => {
                e.stopPropagation();
                onClose(path);
            }}
        />
    </div>
);

const TabManager = () => {
    const { editorState, setEditorState, buffersRef } = useEditorContext();
    const { settings } = useSettingsContext();

    const [contextMenu, setContextMenu] = useState<{
        visible: boolean;
        x: number;
        y: number;
        targetPath: string;
    } | null>(null);

    // Dismiss context menu on click outside or Escape
    useEffect(() => {
        const handleClickOutside = () => setContextMenu(null);
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setContextMenu(null);
        };
        window.addEventListener("click", handleClickOutside);
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("click", handleClickOutside);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    const handleContextMenu = (e: React.MouseEvent, path: string) => {
        e.preventDefault();
        e.stopPropagation();

        const x = Math.min(e.clientX, window.innerWidth - 190);
        const y = Math.min(e.clientY, window.innerHeight - 220);

        setContextMenu({
            visible: true,
            x,
            y,
            targetPath: path,
        });
    };

    const changeActiveFile = (path: string) => {
        setEditorState((prev) => ({
            ...prev,
            activeFile: path,
        }));
    };

    // Helper for bulk closing tabs
    const closeMultipleTabs = async (pathsToClose: string[]) => {
        if (pathsToClose.length === 0) return;

        let hasUnsaved = false;
        for (const path of pathsToClose) {
            const closedFile = editorState.openedFiles[path];
            if (closedFile?.isDirty) {
                if (settings.files.autoSave === "afterDelay") {
                    try {
                        await fileSystem.saveFile(path, buffersRef.current[path]);
                    } catch (err) {
                        console.error("AUTOSAVE: Failed to save file", path, err);
                    }
                } else {
                    hasUnsaved = true;
                }
            }
        }

        if (hasUnsaved) {
            notify.error('Files Not Saved!', 'Some closed tabs had unsaved changes.');
        }

        setEditorState((prev) => {
            const newOpenFiles = { ...prev.openedFiles };
            pathsToClose.forEach((path) => {
                delete newOpenFiles[path];
            });

            const newOpenTabs = prev.openedTabs.filter(
                (tab) => !pathsToClose.includes(tab)
            );

            let newActiveFile = prev.activeFile;

            if (prev.activeFile && pathsToClose.includes(prev.activeFile)) {
                newActiveFile =
                    newOpenTabs.length > 0
                        ? newOpenTabs[newOpenTabs.length - 1]
                        : null;
            }

            return {
                ...prev,
                openedFiles: newOpenFiles,
                openedTabs: newOpenTabs,
                activeFile: newActiveFile,
            };
        });
    };

    const closeTab = (path: string) => {
        closeMultipleTabs([path]);
    };

    const closeOtherTabs = (targetPath: string) => {
        const pathsToClose = editorState.openedTabs.filter(p => p !== targetPath);
        closeMultipleTabs(pathsToClose);
    };

    const closeTabsToRight = (targetPath: string) => {
        const index = editorState.openedTabs.indexOf(targetPath);
        if (index !== -1) {
            const pathsToClose = editorState.openedTabs.slice(index + 1);
            closeMultipleTabs(pathsToClose);
        }
    };

    const closeTabsToLeft = (targetPath: string) => {
        const index = editorState.openedTabs.indexOf(targetPath);
        if (index !== -1) {
            const pathsToClose = editorState.openedTabs.slice(0, index);
            closeMultipleTabs(pathsToClose);
        }
    };

    const closeAllTabs = () => {
        closeMultipleTabs([...editorState.openedTabs]);
    };

    return (
        <div className="tab-bar">
            {editorState.openedTabs.map((path) => {
                const file = editorState.openedFiles[path];
                if (!file) return null;

                return (
                    <Tab
                        key={path}
                        path={path}
                        name={file.fileInfo.name}
                        active={path === editorState.activeFile}
                        isDirty={file.isDirty}
                        onClose={closeTab}
                        onClick={changeActiveFile}
                        onContextMenu={handleContextMenu}
                    />
                );
            })}

            {/* Context Menu */}
            {contextMenu?.visible && (
                <div
                    className="tab-context-menu"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        className="tab-context-item"
                        onClick={() => {
                            closeTab(contextMenu.targetPath);
                            setContextMenu(null);
                        }}
                    >
                        <X size={13} />
                        <span>Close</span>
                    </button>

                    <button
                        className="tab-context-item"
                        onClick={() => {
                            closeOtherTabs(contextMenu.targetPath);
                            setContextMenu(null);
                        }}
                    >
                        <MinusCircle size={13} />
                        <span>Close Others</span>
                    </button>

                    <button
                        className="tab-context-item"
                        onClick={() => {
                            closeTabsToRight(contextMenu.targetPath);
                            setContextMenu(null);
                        }}
                    >
                        <ArrowRight size={13} />
                        <span>Close to the Right</span>
                    </button>

                    <button
                        className="tab-context-item"
                        onClick={() => {
                            closeTabsToLeft(contextMenu.targetPath);
                            setContextMenu(null);
                        }}
                    >
                        <ArrowLeft size={13} />
                        <span>Close to the Left</span>
                    </button>

                    <div className="tab-context-divider" />

                    <button
                        className="tab-context-item text-rose-400"
                        onClick={() => {
                            closeAllTabs();
                            setContextMenu(null);
                        }}
                    >
                        <XCircle size={13} />
                        <span>Close All</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default TabManager;
