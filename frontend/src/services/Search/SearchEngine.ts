import { paletteItem } from "../../components/Body/CommandPalette/CommandPaletteManager";
import { FileInfo } from "../../Types/filesystem";

export interface ScanResult {
    files: FileInfo[];
    pendingFolders: string[];
}

declare global {
    interface Window {
        search?: {
            scanDirectory: (path: string) => Promise<ScanResult>
        }
    }
}

export interface SearchEngine {
    buildIndex: (workingDirectory: string) => Promise<void>;
    search: (query: string) => FileInfo[];
    clear(): void;
}


export class FileSearchEngine implements SearchEngine {
    // Indexed files
    private files: FileInfo[] = [];

    // Workspace cache
    private previousWorkingDirectory: string | null = null;

    // Search cache
    private previousQuery = "";
    private previousResults: FileInfo[] = [];

    constructor() {
        console.log("NEW SEARCH ENGINE CREATED");
    }
    private async scanInBackend(directory: string): Promise<ScanResult> {
        console.log("backend file search requested for", directory);
        if (!window.search) {
            const error = 'window SearchEngine API is not defined or some error occured';
            console.error(error)
            throw new Error(error)
        }
        try {
            const scanResult: ScanResult = await window.search.scanDirectory(directory)
            return scanResult;
        } catch (err) {
            console.error('some error occured to get the result')
        }
        return {
            files: [],
            pendingFolders: []
        }
    }

    private async scanFolderRec(directory: string): Promise<void> {
        try {
            const result = await this.scanInBackend(directory);
            console.error('scanFolderRec inside SearchEngine', result, directory)
            this.files.push(...result.files);

            for (const dir of result.pendingFolders) {
                void this.scanFolderRec(dir);
            }
        } catch (err) {
            console.error("SKIPPED :: error while scanning", directory, err);
        }
    }

    async buildIndex(workingDirectory: string): Promise<void> {
        if (!workingDirectory) {
            console.error(`${workingDirectory} is not a valid path`);
            return;
        }

        if (workingDirectory === this.previousWorkingDirectory) {
            return;
        }

        this.clear();

        this.previousWorkingDirectory = workingDirectory;
        void this.scanFolderRec(workingDirectory);
    }

    search(query: string): FileInfo[] {
        query = query.trim().toLowerCase();
        if (query === "") {
            this.previousQuery = "";
            this.previousResults = [...this.files];
            return [];
        }
        if (query === this.previousQuery) {
            return this.previousResults;
        }

        const source = query.startsWith(this.previousQuery) ? this.previousResults : this.files;

        const results = source.filter((file) => {
            return file.name.toLowerCase().includes(query)
        }
        );
        this.previousQuery = query;
        this.previousResults = [...results];

        return results;
    }

    async commandPaletteFileSearch(query: string): Promise<paletteItem[]> {
        const localResult: FileInfo[] = this.search(query);
        return localResult.map((file) => {
            return {
                title: file.name,
                secondaryTitle: file.path,
                type: "File",
                payload: file
            }
        })
    }

    clear(): void {
        console.log('called ================================clear')
        this.files = [];

        this.previousQuery = "";
        this.previousResults = [];

        this.previousWorkingDirectory = null;
    }
}

export const searchEngine = new FileSearchEngine();
