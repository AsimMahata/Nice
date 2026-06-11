import { X } from "lucide-react";
import { useEditorContext } from "../../contexts/Editor/EditorProvider";
import { notify } from "../../utils/notification";

interface TabProps {
    path: string;
    name: string;
    active: boolean;
    onClose: (path: string) => void;
    onClick: (path: string) => void;
}

const Tab = ({
    path,
    name,
    active,
    onClose,
    onClick
}: TabProps) => (
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

const TabManager = () => {
    const { editorState, setEditorState } = useEditorContext();


    const changeActiveFile = (path: string) => {
        setEditorState((prev) => {
            const newActiveFile = path;
            return {
                ...prev,
                activeFile: newActiveFile,
            };
        })
    }

    const closeTab = (path: string) => {
        setEditorState((prev) => {
            const newOpenFiles = { ...prev.openFiles };
            const closedFile = newOpenFiles[path];
            if (closedFile.isDirty) {
                console.error('file is not saved are your sure you want to close');
                notify.error('!!!!!!!!!!!!!!!', '!!!!!!!!!')
            }
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
