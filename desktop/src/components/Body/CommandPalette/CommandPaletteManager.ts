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

    register(setCanShow: React.Dispatch<React.SetStateAction<boolean>>, setItems: React.Dispatch<React.SetStateAction<paletteItem[]>>) {
        this.setCanShow = setCanShow;
        this.setItems = setItems;
    }

    // TODO: so many todo
    showCommandPalette(items: paletteItem[]) {
        if (!this.setCanShow || !this.setItems) {
            console.error('setItems and setCanShow not set in commandPaletteManage')
            return;
        }
        this.setItems(items);
        this.setCanShow(true)
        this.visible = true;
        console.log('showing command Palette', items)
    }

    clearPaletteItems() {
        if (!this.setCanShow || !this.setItems) {
            console.error('setItems and setCanShow not set in commandPaletteManage')
            return;
        }
        this.setItems([])
    }

    hideCommadPalette() {
        if (!this.setCanShow || !this.setItems) {
            console.error('setItems and setCanShow not set in commandPaletteManage')
            return;
        }
        this.setCanShow(false)
        this.visible = false;
    }

    toggleVisibility() {
        if (!this.setCanShow || !this.setItems) {
            console.error('setItems and setCanShow not set in commandPaletteManage')
            return;
        }
        this.setCanShow(!this.visible);
        this.visible = !this.visible
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
