import { app } from 'electron';
import fs from 'fs';
import path from 'path';

export interface Snippet {
    prefix: string;
    body: string[];
    description: string;
}

export interface SnippetsData {
    [name: string]: Snippet;
}

class SnippetManager {
    private snippetsDir: string;

    constructor() {
        this.snippetsDir = path.join(app.getPath('userData'), 'snippets');
        if (!fs.existsSync(this.snippetsDir)) {
            fs.mkdirSync(this.snippetsDir, { recursive: true });
        }
    }

    public getSnippetsRaw(language: string): string {
        const filePath = path.join(this.snippetsDir, `${language}.json`);
        if (!fs.existsSync(filePath)) {
            return "{\n    // Example:\n    // \"Print to console\": {\n    //     \"prefix\": \"log\",\n    //     \"body\": [\n    //         \"console.log('$1');\",\n    //         \"$2\"\n    //     ],\n    //     \"description\": \"Log output to console\"\n    // }\n}";
        }
        try {
            return fs.readFileSync(filePath, 'utf-8');
        } catch (err) {
            console.error(`Failed to read snippets for ${language}:`, err);
            return "{}";
        }
    }

    public saveSnippetsRaw(language: string, rawJson: string): boolean {
        const filePath = path.join(this.snippetsDir, `${language}.json`);
        try {
            // validate json first
            JSON.parse(rawJson);
            fs.writeFileSync(filePath, rawJson, 'utf-8');
            return true;
        } catch (err) {
            console.error(`Failed to save snippets for ${language} (Invalid JSON or IO error):`, err);
            return false;
        }
    }

    public getSnippetsParsed(language: string): SnippetsData {
        const raw = this.getSnippetsRaw(language);
        try {
            return JSON.parse(raw);
        } catch (e) {
            return {};
        }
    }
}

export const snippetManager = new SnippetManager();
