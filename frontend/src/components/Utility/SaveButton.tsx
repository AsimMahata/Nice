import { useEditorContext } from "../../contexts/Editor/EditorProvider"
import { useFileActions } from "../FileEx/FileActions";

type Props = {}

const SaveButton = ({ }: Props) => {
    const { editorState, setEditorState } = useEditorContext()
    const getDirtyStatus = () => {
        return editorState.activeFile
            ? editorState.openFiles[editorState.activeFile]?.isDirty ?? false
            : false;
    }
    const FileActions = useFileActions()
    const handleSaveFile = async () => {
        const path = editorState.activeFile;

        if (!path) return;

        const success = await FileActions.saveFiles(path);

        if (success) {
            setEditorState(prev => ({
                ...prev,
                openFiles: {
                    ...prev.openFiles,
                    [path]: {
                        ...prev.openFiles[path],
                        isDirty: false,
                    },
                },
            }));
            console.log('saving file was success')
        }
        else
            console.error('saving file was unsuccess')
    };
    return (
        <button
            onClick={handleSaveFile}
            style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "#111",
                color: getDirtyStatus() ? "goldenrod" : "green",
                border: "1px solid #333",
                borderRadius: "4px",
                padding: "4px 10px",
                cursor: "pointer",
                fontSize: "12px",
                fontFamily: "inherit",
                transition: "transform 0.08s ease, background 0.08s ease",
            }}
            onMouseDown={(e) => {
                e.currentTarget.style.transform = "translateY(1px)";
            }}
            onMouseUp={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
            }}
        >
            {getDirtyStatus() ? "NotSaved" : "Saved"}
        </button>
    )
}

export default SaveButton
