import React from "react"
import { searchEngine } from "../../../services/Search/SearchEngine"
import { paletteItem } from "./palette.types"

export interface paletteQuery {
    query: string,
    queryProcessor?: (query: string) => Promise<paletteItem[]>
}


class CommandPaletteManager {

    private visible: boolean = false;
    private setCanShow: React.Dispatch<React.SetStateAction<boolean>> | null = null;
    private setItems: React.Dispatch<React.SetStateAction<paletteItem[]>> | null = null;
    private focusInputCallback: (() => void) | null = null;
    private blurInputCallback: (() => void) | null = null;

    register(
        setCanShow: React.Dispatch<React.SetStateAction<boolean>>,
        setItems: React.Dispatch<React.SetStateAction<paletteItem[]>>,
        focusInput?: () => void,
        blurInput?: () => void
    ) {
        this.setCanShow = setCanShow;
        this.setItems = setItems;
        if (focusInput) this.focusInputCallback = focusInput;
        if (blurInput) this.blurInputCallback = blurInput;
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

    async openCommandPalette() {
        if (this.setCanShow) {
            this.setCanShow(true);
            this.visible = true;
        }
        if (this.setItems) {
            const items = await this.processQuery("");
            this.setItems(items);
        }
        if (this.focusInputCallback) {
            this.focusInputCallback();
        }
    }

    clearPaletteItems() {
        if (!this.setCanShow || !this.setItems) {
            console.error('setItems and setCanShow not set in commandPaletteManage')
            return;
        }
        this.setItems([])
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
        // for now just search files
        return {
            query: query,
            queryProcessor: async (query) => searchEngine.commandPaletteFileSearch(query)
        }
    }
    async processQuery(query: string): Promise<paletteItem[]> {
        const processedQuery = this.queryParser(query)
        const results = await processedQuery.queryProcessor?.(processedQuery.query)
        return results ?? []
    }
}

export const commandPaletteManager = new CommandPaletteManager()
