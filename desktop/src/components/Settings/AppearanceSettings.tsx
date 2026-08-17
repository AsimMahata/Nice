import { useSettingsContext } from "../../contexts/Settings/SettingsProvider";
import { AppearanceSettings as IAppearanceSettings } from "../../contexts/Settings/SettingsContext";
import { SyncSettingsBanner } from "./SyncSettingsBanner";

const AppearanceSettings = () => {
    const { settings, updateAppearanceSettings } = useSettingsContext();
    const appearance = settings.appearance;

    const handleChange = (key: keyof IAppearanceSettings, value: any) => {
        updateAppearanceSettings({ [key]: value });
    };

    return (
        <div className="settings-section">
            <h3>Appearance Settings</h3>
            
            <div className="setting-item">
                <label>Theme</label>
                <select
                    value={appearance.theme}
                    onChange={(e) => handleChange("theme", e.target.value)}
                >
                    <option value="vs-dark">Dark (Visual Studio)</option>
                    <option value="vs">Light (Visual Studio)</option>
                    <option value="hc-black">High Contrast Black</option>
                    <option value="hc-light">High Contrast Light</option>
                </select>
            </div>

            <div className="setting-item">
                <label>Icon Theme</label>
                <select
                    value={appearance.iconTheme}
                    onChange={(e) => handleChange("iconTheme", e.target.value)}
                >
                    <option value="material">Material Icon Theme</option>
                    <option value="minimal">Minimal</option>
                    <option value="vs-seti">VS Seti</option>
                </select>
            </div>

            <SyncSettingsBanner sectionName="Appearance" />
        </div>
    );
};

export default AppearanceSettings;
