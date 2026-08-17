import { useSettingsContext } from "../../contexts/Settings/SettingsProvider";
import { AppearanceSettings as IAppearanceSettings } from "../../contexts/Settings/SettingsContext";
import { SyncSettingsBanner } from "./SyncSettingsBanner";
import { THEME_LIST } from "../../core/Themes/themeManager";

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
                <label>Color Theme</label>
                <select
                    value={appearance.theme}
                    onChange={(e) => handleChange("theme", e.target.value)}
                >
                    {THEME_LIST.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="setting-item">
                <label>Icon Theme</label>
                <select
                    value={appearance.iconTheme}
                    onChange={(e) => handleChange("iconTheme", e.target.value)}
                >
                    <option value="material">Material Color Icons (Default)</option>
                    <option value="vs-seti">VS Seti File Icons</option>
                    <option value="minimal">Minimal Monochrome Icons</option>
                </select>
            </div>

            <SyncSettingsBanner sectionName="Appearance" />
        </div>
    );
};

export default AppearanceSettings;
