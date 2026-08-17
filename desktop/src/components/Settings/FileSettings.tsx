import { useSettingsContext } from "../../contexts/Settings/SettingsProvider";
import { SyncSettingsBanner } from "./SyncSettingsBanner";

const FileSettings = () => {
    const { settings, updateFilesSettings } = useSettingsContext();

    return (
        <div className="settings-section" style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
            <h3>Files Settings</h3>
            <p style={{ color: "var(--label-color)", marginBottom: "20px" }}>
                Configure how files are saved and managed.
            </p>

            <div className="setting-item">
                <label>Auto Save</label>
                <select
                    value={settings.files.autoSave}
                    onChange={(e) => updateFilesSettings({ autoSave: e.target.value as any })}
                >
                    <option value="off">Off</option>
                    <option value="afterDelay">On With Delay</option>
                </select>
                <div className="setting-description">
                    Controls auto save of dirty files.
                </div>
            </div>

            {settings.files.autoSave === "afterDelay" && (
                <div className="setting-item">
                    <label>Auto Save Delay (ms)</label>
                    <input
                        type="number"
                        min="100"
                        step="100"
                        value={settings.files.autoSaveDelay}
                        onChange={(e) => updateFilesSettings({ autoSaveDelay: parseInt(e.target.value, 10) || 1000 })}
                    />
                    <div className="setting-description">
                        Delay in milliseconds after which a dirty file is saved automatically.
                    </div>
                </div>
            )}

            <SyncSettingsBanner sectionName="Files" />
        </div>
    );
};

export default FileSettings;
