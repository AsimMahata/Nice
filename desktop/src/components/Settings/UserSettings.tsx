import { useSettingsContext } from "../../contexts/Settings/SettingsProvider";
import { SyncSettingsBanner } from "./SyncSettingsBanner";

const UserSettings = () => {
    const { settings, updateExecutionSettings } = useSettingsContext();

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
        <div className="settings-section" style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
            <h3>User Settings</h3>

            <div className="setting-item" style={{ marginBottom: "30px", maxWidth: "450px" }}>
                <label style={{ fontWeight: "600", fontSize: "0.95rem" }}>Compiler & Execution Preference</label>
                <select
                    value={settings.execution?.executionMode ?? "auto"}
                    onChange={(e) => updateExecutionSettings({ executionMode: e.target.value as "auto" | "local" | "online" })}
                    style={{
                        width: "100%",
                        padding: "8px 10px",
                        marginTop: "8px",
                        borderRadius: "4px",
                        backgroundColor: "var(--input-bg, #3c3c3c)",
                        color: "var(--input-fg, #fff)",
                        border: "1px solid var(--border-color, #444)",
                        fontSize: "0.9rem",
                        outline: "none"
                    }}
                >
                    <option value="auto">Auto (Prefer local compiler, fallback to online compiler)</option>
                    <option value="local">Run Locally Only (Use local compilers via terminal)</option>
                    <option value="online">Use Online Compiler Only (Execute via backend sandbox)</option>
                </select>
                <div className="setting-description" style={{ marginTop: "8px", fontSize: "0.85rem", color: "var(--label-color, #aaa)", lineHeight: "1.4" }}>
                    Configure whether code is compiled & executed locally on your machine or sent directly to the online sandbox compiler.
                </div>
            </div>

            <div className="setting-item" style={{ maxWidth: "500px" }}>
                <label style={{ fontWeight: "600", fontSize: "0.95rem" }}>Account & Synchronization</label>
                <p style={{ marginBottom: "15px", color: "var(--label-color, #ccc)", fontSize: "0.85rem", lineHeight: "1.4" }}>
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

            <SyncSettingsBanner sectionName="User" />
        </div>
    );
};

export default UserSettings;
