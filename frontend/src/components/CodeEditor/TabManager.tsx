import { X } from "lucide-react";
import { useEditorContext } from "../../contexts/Editor/EditorProvider";
import { useSettingsContext } from "../../contexts/Settings/SettingsProvider";
import { useFileActions } from "../FileEx/FileActions";
import { notify } from "../../utils/notification";

interface TabProps {
    path: string;
    name: string;
    active: boolean;
    onClose: (path: string) => void;
    onClick: (path: string) => void;
}

const Tab = ({ path, name, active, onClose, onClick }: TabProps) => (
    <div className={`tab-item ${active ? "active" : ""}`}
        onClick={() => onClick(path)}
    >
        <span>{name}</span>

        <X
            size={14}
            className="close-icon"
            onClick={(e) => {
                e.stopPropagation();
                onClose(path);
            }}
        />
    </div>
);

//BUG: tab overflow fix

const TabManager = () => {
    const { editorState, setEditorState, buffersRef } = useEditorContext();
    const { settings } = useSettingsContext();
    const FileActions = useFileActions();

    const changeActiveFile = (path: string) => {
        setEditorState((prev) => {
            const newActiveFile = path;
            return {
                ...prev,
                activeFile: newActiveFile,
            };
        });
    };

    const closeTab = async (path: string) => {
        const closedFile = editorState.openFiles[path];
        if (closedFile?.isDirty) {
            if (settings.files.autoSave === "afterDelay") {
                await FileActions.saveFiles(path, buffersRef.current[path]);
            } else {
                console.error('file is not saved are your sure you want to close');
                notify.error('File Not Saved!', 'You closed a file with unsaved changes.');
            }
        }

        setEditorState((prev) => {
            const newOpenFiles = { ...prev.openFiles };
            delete newOpenFiles[path];

            const newOpenTabs = prev.openTabs.filter(
                (tab) => tab !== path
            );

            let newActiveFile = prev.activeFile;

            if (prev.activeFile === path) {
                newActiveFile =
                    newOpenTabs.length > 0
                        ? newOpenTabs[newOpenTabs.length - 1]
                        : null;
            }
            console.log('new tab is ..........', newActiveFile)
            return {
                ...prev,
                openFiles: newOpenFiles,
                openTabs: newOpenTabs,
                activeFile: newActiveFile,
            };
        });
    };

    return (
        <div className="tab-bar">
            {editorState.openTabs.map((path) => {
                const file = editorState.openFiles[path];

                if (!file) return null;

                return (
                    <Tab
                        key={path}
                        path={path}
                        name={file.fileInfo.name}
                        active={path === editorState.activeFile}
                        onClose={closeTab}
                        onClick={changeActiveFile}
                    />
                );
            })}
        </div>
    );
};

export default TabManager;
