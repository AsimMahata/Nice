import { searchEngine } from "../../../services/Search/SearchEngine"

export interface paletteQuery {
    query: string,
    queryProcessor?: (query: string) => Promise<paletteItem[]>
}

export interface paletteItem {
    title: string,
    secondaryTitle?: string,
    icon?: string,
    type: "File" | "Command" | "Theme" | "Settings", // it can support many things
    payload?: unknown
}

class CommandPaletteManager {

    private paletteItems: paletteItem[] = []
    private visible: boolean = false
    // TODO: so many todo
    showCommandPalette() {
        console.log('showing command Palette', this.paletteItems)
    }

    hideCommadPalette() {
        console.log('hiding CommandPalette')
    }

    toggleVisibility() {
        console.log('toggleVisibility of command palette', this.visible)
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
