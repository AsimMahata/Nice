import { ReactNode, useContext, useEffect, useState } from "react";
import SettingsContext, { SettingsState, DEFAULT_SETTINGS } from "./SettingsContext";
import { applyAppTheme } from "../../core/Themes/themeManager";

const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);

    useEffect(() => {
        applyAppTheme(settings.appearance.theme);
    }, [settings.appearance.theme]);

    useEffect(() => {
        // Load settings from Electron on mount
        if (window.settings) {
            window.settings.getSettings().then((loadedSettings) => {
                if (loadedSettings) {
                    setSettings({
                        ...DEFAULT_SETTINGS,
                        ...loadedSettings,
                        execution: {
                            ...DEFAULT_SETTINGS.execution,
                            ...(loadedSettings.execution || {})
                        }
                    });
                }
            });
        }
    }, []);

    const updateSettings = (newSettings: SettingsState) => {
        setSettings(newSettings);
        if (window.settings) {
            window.settings.saveSettings(newSettings);
        }
    };

    const updateEditorSettings = (newEditorSettings: Partial<SettingsState["editor"]>) => {
        const updated = {
            ...settings,
            editor: {
                ...settings.editor,
                ...newEditorSettings
            }
        };
        updateSettings(updated);
    };

    const updateAppearanceSettings = (newAppearanceSettings: Partial<SettingsState["appearance"]>) => {
        const updated = {
            ...settings,
            appearance: {
                ...settings.appearance,
                ...newAppearanceSettings
            }
        };
        updateSettings(updated);
    };

    const updateFilesSettings = (newFilesSettings: Partial<SettingsState["files"]>) => {
        const updated = {
            ...settings,
            files: {
                ...settings.files,
                ...newFilesSettings
            }
        };
        updateSettings(updated);
    };

    const updateExecutionSettings = (newExecutionSettings: Partial<SettingsState["execution"]>) => {
        const updated = {
            ...settings,
            execution: {
                ...settings.execution,
                ...newExecutionSettings
            }
        };
        updateSettings(updated);
    };

    return (
        <SettingsContext.Provider
            value={{
                settings,
                updateSettings,
                updateEditorSettings,
                updateAppearanceSettings,
                updateFilesSettings,
                updateExecutionSettings
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
};

export default SettingsProvider;

export const useSettingsContext = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettingsContext must be used within a SettingsProvider');
    }
    return context;
};
