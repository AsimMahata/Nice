import React from "react";
import { searchEngine } from "../../../services/Search/SearchEngine";
import { paletteItem } from "./palette.types";

export interface paletteQuery {
    query: string;
    queryProcessor?: (query: string) => Promise<paletteItem[]>;
}

export const ALL_COMMANDS: paletteItem[] = [
    {
        title: "Preferences: Color Theme: Nice Dark (Default)",
        secondaryTitle: "Switch to default dark theme",
        type: "Theme",
        payload: "nice-dark",
    },
    {
        title: "Preferences: Color Theme: One Dark Pro",
        secondaryTitle: "Switch to One Dark Pro theme",
        type: "Theme",
        payload: "one-dark-pro",
    },
    {
        title: "Preferences: Color Theme: Dracula",
        secondaryTitle: "Switch to Dracula theme",
        type: "Theme",
        payload: "dracula",
    },
    {
        title: "Preferences: Color Theme: Tokyo Night",
        secondaryTitle: "Switch to Tokyo Night theme",
        type: "Theme",
        payload: "tokyo-night",
    },
    {
        title: "Preferences: Color Theme: Catppuccin Macchiato",
        secondaryTitle: "Switch to Catppuccin theme",
        type: "Theme",
        payload: "catppuccin",
    },
    {
        title: "Preferences: Color Theme: GitHub Light",
        secondaryTitle: "Switch to GitHub Light theme",
        type: "Theme",
        payload: "github-light",
    },
    {
        title: "Preferences: Color Theme: One Light",
        secondaryTitle: "Switch to One Light theme",
        type: "Theme",
        payload: "one-light",
    },
    {
        title: "View: Toggle Terminal",
        secondaryTitle: "Open or close embedded PTY terminal",
        type: "Command",
        payload: "terminal.toggle",
    },
    {
        title: "File: Save Active File",
        secondaryTitle: "Save changes to current file",
        type: "Command",
        payload: "file.save",
    },
];

class CommandPaletteManager {
    private visible: boolean = false;
    private setCanShow: React.Dispatch<React.SetStateAction<boolean>> | null = null;
    private setItems: React.Dispatch<React.SetStateAction<paletteItem[]>> | null = null;
    private focusInputCallback: (() => void) | null = null;
    private blurInputCallback: (() => void) | null = null;
    private setInputValueCallback: ((val: string) => void) | null = null;

    register(
        setCanShow: React.Dispatch<React.SetStateAction<boolean>>,
        setItems: React.Dispatch<React.SetStateAction<paletteItem[]>>,
        focusInput?: () => void,
        blurInput?: () => void,
        setInputValue?: (val: string) => void
    ) {
        this.setCanShow = setCanShow;
        this.setItems = setItems;
        if (focusInput) this.focusInputCallback = focusInput;
        if (blurInput) this.blurInputCallback = blurInput;
        if (setInputValue) this.setInputValueCallback = setInputValue;
    }

    async toggleCommandPalette() {
        if (this.visible) {
            this.hideCommadPalette();
            if (this.blurInputCallback) {
                this.blurInputCallback();
            }
        } else {
            await this.openCommandPalette();
        }
    }

    async openCommandPalette(initialQuery: string = "") {
        if (this.setCanShow) {
            this.setCanShow(true);
            this.visible = true;
        }
        if (this.setInputValueCallback) {
            this.setInputValueCallback(initialQuery);
        }
        if (this.setItems) {
            const items = await this.processQuery(initialQuery);
            this.setItems(items);
        }
        if (this.focusInputCallback) {
            this.focusInputCallback();
        }
    }

    async openCommandMode() {
        await this.openCommandPalette(">");
    }

    clearPaletteItems() {
        if (!this.setCanShow || !this.setItems) {
            return;
        }
        this.setItems([]);
    }

    hideCommadPalette() {
        if (this.setCanShow) {
            this.setCanShow(false);
        }
        this.visible = false;
    }

    toggleVisibility() {
        this.toggleCommandPalette();
    }

    queryParser(query: string): paletteQuery {
        if (query.startsWith(">")) {
            return {
                query: query,
                queryProcessor: async (q) => {
                    const filterTerm = q.replace(/^>/, "").trim().toLowerCase();
                    if (!filterTerm) return ALL_COMMANDS;
                    return ALL_COMMANDS.filter(
                        (cmd) =>
                            cmd.title.toLowerCase().includes(filterTerm) ||
                            (cmd.secondaryTitle && cmd.secondaryTitle.toLowerCase().includes(filterTerm))
                    );
                },
            };
        }

        return {
            query: query,
            queryProcessor: async (q) => searchEngine.commandPaletteFileSearch(q),
        };
    }

    async processQuery(query: string): Promise<paletteItem[]> {
        const processedQuery = this.queryParser(query);
        const results = await processedQuery.queryProcessor?.(processedQuery.query);
        return results ?? [];
    }
}

export const commandPaletteManager = new CommandPaletteManager();
