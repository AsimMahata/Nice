import { X, Settings, User, FileCode, FileText } from "lucide-react";
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
}

const getTabIcon = (path: string) => {
    if (path === "nice://settings") return <Settings size={13} style={{ color: "var(--accent-light)", flexShrink: 0 }} />;
    if (path === "nice://profile") return <User size={13} style={{ color: "var(--status-info)", flexShrink: 0 }} />;
    if (path.endsWith(".json") || path.endsWith(".md") || path.endsWith(".txt")) {
        return <FileText size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />;
    }
    return <FileCode size={13} style={{ color: "var(--accent-light)", flexShrink: 0 }} />;
};

const Tab = ({ path, name, active, isDirty, onClose, onClick }: TabProps) => (
    <div
        className={`tab-item ${active ? "active" : ""}`}
        onClick={() => onClick(path)}
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

    const changeActiveFile = (path: string) => {
        setEditorState((prev) => {
            return {
                ...prev,
                activeFile: path,
            };
        });
    };

    const closeTab = async (path: string) => {
        const closedFile = editorState.openedFiles[path];
        if (closedFile?.isDirty) {
            if (settings.files.autoSave === "afterDelay") {
                try {
                    await fileSystem.saveFile(
                        path,
                        buffersRef.current[path]
                    );
                } catch (err) {
                    console.error(
                        "AUTOSAVE: Failed to save file",
                        path,
                        err
                    );
                }
            } else {
                console.error('file is not saved are your sure you want to close');
                notify.error('File Not Saved!', 'You closed a file with unsaved changes.');
            }
        }

        setEditorState((prev) => {
            const newOpenFiles = { ...prev.openedFiles };
            delete newOpenFiles[path];

            const newOpenTabs = prev.openedTabs.filter(
                (tab) => tab !== path
            );

            let newActiveFile = prev.activeFile;

            if (prev.activeFile === path) {
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
                    />
                );
            })}
        </div>
    );
};

export default TabManager;
