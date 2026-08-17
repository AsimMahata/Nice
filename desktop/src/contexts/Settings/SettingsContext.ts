import React, { createContext } from "react";

export interface EditorSettings {
    fontFamily: string;
    fontWeight: string;
    fontSize: number;
    lineHeight: number;
    letterSpacing: number;
    cursorBlinking: "blink" | "smooth" | "phase" | "expand" | "solid";
    cursorSmoothCaretAnimation: "off" | "on" | "explicit";
    fontLigatures: boolean;
    wordWrap: "on" | "off" | "wordWrapColumn" | "bounded";
    minimap: boolean;
    lineNumbers: "on" | "off" | "relative" | "interval";
    tabSize: number;
    insertSpaces: boolean;
    autoClosingBrackets: "always" | "languageDefined" | "beforeWhitespace" | "never";
    autoClosingQuotes: "always" | "languageDefined" | "beforeWhitespace" | "never";
    formatOnSave: boolean;
    smoothScrolling: boolean;
}

export interface AppearanceSettings {
    theme: string;
    iconTheme: string;
}

export interface FileSettings {
    autoSave: "off" | "afterDelay";
    autoSaveDelay: number;
}

export interface SettingsState {
    editor: EditorSettings;
    appearance: AppearanceSettings;
    files: FileSettings;
}

export interface SettingsContextType {
    settings: SettingsState;
    updateSettings: (newSettings: SettingsState) => void;
    updateEditorSettings: (newEditorSettings: Partial<EditorSettings>) => void;
    updateAppearanceSettings: (newAppearanceSettings: Partial<AppearanceSettings>) => void;
    updateFilesSettings: (newFilesSettings: Partial<FileSettings>) => void;
}

export const DEFAULT_SETTINGS: SettingsState = {
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
    },
    files: {
        autoSave: "off",
        autoSaveDelay: 1000,
    }
};

declare global {
    interface Window {
        settings?: {
            getSettings: () => Promise<SettingsState>;
            saveSettings: (settings: SettingsState) => Promise<boolean>;
        };
        snippets?: {
            getSnippetsRaw: (language: string) => Promise<string>;
            saveSnippetsRaw: (language: string, rawJson: string) => Promise<boolean>;
            getSnippetsParsed: (language: string) => Promise<any>;
        };
    }
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export default SettingsContext;
