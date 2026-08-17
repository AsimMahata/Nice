import { Save, CheckCircle2 } from "lucide-react";
import { useEditorContext } from "../../contexts/Editor/EditorProvider";
import { fileSystem } from "../../services/FileSystem/FileSystem";

const SaveButton = () => {
    const { editorState, setEditorState, getDirtyStatus, buffersRef } = useEditorContext();
    const isDirty = getDirtyStatus();

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

    if (!editorState.activeFile) return null;

    return (
        <button
            onClick={handleSaveFile}
            title={isDirty ? "Save File (Unsaved changes)" : "File Saved"}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: isDirty ? "rgba(245, 158, 11, 0.15)" : "var(--bg-elevated)",
                color: isDirty ? "var(--status-warning)" : "var(--text-secondary)",
                border: `1px solid ${isDirty ? "rgba(245, 158, 11, 0.3)" : "var(--border-subtle)"}`,
                borderRadius: "var(--radius-sm)",
                padding: "4px 10px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 500,
                transition: "all 0.15s ease",
            }}
        >
            {isDirty ? (
                <>
                    <Save size={14} className="animate-pulse" />
                    <span>Save</span>
                </>
            ) : (
                <>
                    <CheckCircle2 size={14} style={{ color: "var(--status-success)" }} />
                    <span>Saved</span>
                </>
            )}
        </button>
    );
};

export default SaveButton;
