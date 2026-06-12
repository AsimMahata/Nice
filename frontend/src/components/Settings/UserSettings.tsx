import { useSettingsContext } from "../../contexts/Settings/SettingsProvider";

const UserSettings = () => {
    const { settings } = useSettingsContext();

    const handleSyncSettings = () => {
        // Mock function for future DB Sync
        console.log("Syncing settings to DB...", settings);
        alert("Settings synced to cloud successfully!");
    };

    const handleImportSettings = () => {
        // Mock function for future DB Import
        console.log("Importing settings from DB...");
        alert("Settings imported from cloud successfully!");
    };

    return (
        <div className="settings-section">
            <h3>User Settings</h3>
            
            <div className="setting-item">
                <p style={{ marginBottom: "15px", color: "var(--label-color, #ccc)" }}>
                    Manage your account and synchronization preferences. You can save your settings to the cloud so they are available on any device you log into.
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
                        Sync Settings to Cloud
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
        </div>
    );
};

export default UserSettings;
