import { useEditorContext } from "../../contexts/Editor/EditorProvider"
import { fileSystem } from "../../services/FileSystem/FileSystem";


const SaveButton = () => {
    const { editorState, setEditorState, getDirtyStatus, buffersRef } = useEditorContext()


    const handleSaveFile = async () => {
        const path = editorState.activeFile;

        if (!path) {
            console.error('SAVEBUTTON: No activeFile currently');
            return;
        }

        try {
            const overrideContent = buffersRef.current[path];

            await fileSystem.saveFile(path, overrideContent);

            setEditorState(prev => ({
                ...prev,
                openedFiles: {
                    ...prev.openedFiles,
                    [path]: {
                        ...prev.openedFiles[path],
                        isDirty: false,
                    },
                },
            }));

            console.log("SAVEFILE: Success");

        } catch (err) {
            console.error(
                "SAVEFILE:SAVEBUTTON: Failed to save file",
                path,
                err
            );
        }
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
