import { app } from 'electron';
import fs from 'fs';
import path from 'path';

export const DEFAULT_SETTINGS = {
    editor: {
        fontFamily: "Consolas, 'Courier New', monospace",
        fontWeight: "normal",
        fontSize: 14,
        lineHeight: 0,
        letterSpacing: 0,
        cursorBlinking: "blink",
        cursorSmoothCaretAnimation: "off",
        fontLigatures: true,
        wordWrap: "off",
        minimap: true,
        lineNumbers: "on",
        tabSize: 4,
        insertSpaces: true,
        autoClosingBrackets: "languageDefined",
        autoClosingQuotes: "languageDefined",
        formatOnSave: true,
        smoothScrolling: true,
    },
    appearance: {
        theme: "vs-dark",
        iconTheme: "material"
    }
};

class SettingsManager {
    private settingsPath: string;

    constructor() {
        // use userData directory to store offline settings across sessions
        this.settingsPath = path.join(app.getPath('userData'), 'settings.json');
    }

    getSettings() {
        try {
            if (fs.existsSync(this.settingsPath)) {
                const data = fs.readFileSync(this.settingsPath, 'utf8');
                // merge user settings with default settings
                return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
            }
        } catch (e) {
            console.error('Failed to read settings', e);
        }
        return DEFAULT_SETTINGS;
    }

    saveSettings(settings: any) {
        try {
            fs.writeFileSync(this.settingsPath, JSON.stringify(settings, null, 2));
            return true;
        } catch (e) {
            console.error('Failed to save settings', e);
            return false;
        }
    }
}

export const settingsManager = new SettingsManager();
