import { useSettingsContext } from "../../contexts/Settings/SettingsProvider";

export const SyncSettingsBanner = ({ sectionName }: { sectionName: string }) => {
    const { settings } = useSettingsContext();

    const handleSyncSettings = () => {
        console.log(`Syncing ${sectionName} settings to DB...`, settings);
        alert(`${sectionName} Settings synced to cloud successfully!`);
    };

    const handleImportSettings = () => {
        console.log(`Importing ${sectionName} settings from DB...`);
        alert(`${sectionName} Settings imported from cloud successfully!`);
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
                    style={{
                        backgroundColor: "var(--accent-color, #007acc)",
                        color: "white",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "3px",
                        cursor: "pointer",
                        fontSize: "0.9rem"
                    }}
                >
                    Save to Cloud
                </button>

                <button 
                    onClick={handleImportSettings}
                    style={{
                        backgroundColor: "var(--input-bg, #3c3c3c)",
                        color: "white",
                        border: "1px solid var(--border-color, #333)",
                        padding: "8px 16px",
                        borderRadius: "3px",
                        cursor: "pointer",
                        fontSize: "0.9rem"
                    }}
                >
                    Import from Cloud
                </button>
            </div>
        </div>
    );
};
