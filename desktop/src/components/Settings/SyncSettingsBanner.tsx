import { useContext, useState } from "react";
import { useSettingsContext } from "../../contexts/Settings/SettingsProvider";
import { AuthContext } from "../../contexts/Auth/AuthContext";

interface SyncSettingsBannerProps {
    sectionName: string;
    onSave?: () => Promise<void>;
    onImport?: () => Promise<void>;
}

export const SyncSettingsBanner = ({ sectionName, onSave, onImport }: SyncSettingsBannerProps) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { settings, updateAppearanceSettings, updateEditorSettings, updateFilesSettings } = useSettingsContext();
    const authContext = useContext(AuthContext);
    const [isLoading, setIsLoading] = useState(false);

    const handleSyncSettings = async () => {
        if (!authContext?.isAuthenticated) {
            alert("You must be logged in to sync settings to the cloud.");
            return;
        }

        setIsLoading(true);
        try {
            if (onSave) {
                await onSave();
            } else {
                let payload = {};
                if (sectionName.toLowerCase() === "editor") payload = { editor: settings.editor };
                else if (sectionName.toLowerCase() === "appearance") payload = { appearance: settings.appearance };
                else if (sectionName.toLowerCase() === "files") payload = { files: settings.files };

                const response = await fetch(`${import.meta.env.VITE_API_URL}/settings`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                if (response.ok && result.success) {
                    alert(`${sectionName} Settings synced to cloud successfully!`);
                } else {
                    alert(`Failed to sync: ${result.message}`);
                }
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred while syncing to the cloud.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleImportSettings = async () => {
        if (!authContext?.isAuthenticated) {
            alert("You must be logged in to import settings from the cloud.");
            return;
        }

        setIsLoading(true);
        try {
            if (onImport) {
                await onImport();
            } else {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/settings`, {
                    credentials: "include"
                });
                const result = await response.json();
                if (response.ok && result.success && result.data) {
                    if (sectionName.toLowerCase() === "editor" && result.data.editor) {
                        updateEditorSettings(result.data.editor);
                        alert("Editor settings imported successfully!");
                    } else if (sectionName.toLowerCase() === "appearance" && result.data.appearance) {
                        updateAppearanceSettings(result.data.appearance);
                        alert("Appearance settings imported successfully!");
                    } else if (sectionName.toLowerCase() === "files" && result.data.files) {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        updateFilesSettings?.(result.data.files);
                        alert("Files settings imported successfully!");
                    } else {
                        alert(`No ${sectionName} settings found in cloud.`);
                    }
                } else {
                    alert(`Failed to import: ${result.message}`);
                }
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred while importing from the cloud.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="setting-item" style={{ marginTop: "40px", paddingTop: "20px", borderTop: "1px solid var(--border-color, #333)", maxWidth: "100%" }}>
            <h4 style={{ marginBottom: "10px", fontSize: "1.1rem", fontWeight: 500 }}>Cloud Sync ({sectionName})</h4>
            <p style={{ marginBottom: "15px", color: "var(--label-color, #ccc)", fontSize: "0.9rem" }}>
                Save your {sectionName.toLowerCase()} preferences to your account so they are available on any device.
            </p>
            
            <div style={{ display: "flex", gap: "10px" }}>
                <button 
                    onClick={handleSyncSettings}
                    disabled={isLoading}
                    style={{
                        backgroundColor: "var(--accent-color, #007acc)",
                        color: "white",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "3px",
                        cursor: isLoading ? "not-allowed" : "pointer",
                        fontSize: "0.9rem",
                        opacity: isLoading ? 0.7 : 1
                    }}
                >
                    {isLoading ? "Syncing..." : "Save to Cloud"}
                </button>

                <button 
                    onClick={handleImportSettings}
                    disabled={isLoading}
                    style={{
                        backgroundColor: "var(--input-bg, #3c3c3c)",
                        color: "white",
                        border: "1px solid var(--border-color, #333)",
                        padding: "8px 16px",
                        borderRadius: "3px",
                        cursor: isLoading ? "not-allowed" : "pointer",
                        fontSize: "0.9rem",
                        opacity: isLoading ? 0.7 : 1
                    }}
                >
                    {isLoading ? "Importing..." : "Import from Cloud"}
                </button>
            </div>
        </div>
    );
};
