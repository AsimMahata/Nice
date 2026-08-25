import { FileInfo } from "../../services/FileSystem/file.options";

export const RUNNABLE_EXTENSIONS: Record<string, string> = {
    '.cpp': 'cpp',
    '.cc': 'cpp',
    '.cxx': 'cpp',
    '.c': 'c',
    '.py': 'python',
    '.java': 'java',
};

export const SUPPORTED_LANGUAGES = ['cpp', 'c', 'python', 'java'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export function getRunnableLanguage(fileInfo?: FileInfo | null, overrideLang?: string | null): string | null {
    if (!fileInfo || !fileInfo.path || fileInfo.path.startsWith('nice://')) {
        return null;
    }

    if (overrideLang && (SUPPORTED_LANGUAGES as readonly string[]).includes(overrideLang)) {
        return overrideLang;
    }

    const ext = fileInfo.extension?.toLowerCase() ?? '';
    return RUNNABLE_EXTENSIONS[ext] || null;
}

export function isRunnableFile(fileInfo?: FileInfo | null, overrideLang?: string | null): boolean {
    return getRunnableLanguage(fileInfo, overrideLang) !== null;
}

export interface CodeRunnerParams {
    codeFile: FileInfo;
    codeLang: string | null;
    cwd: string | null;
    input?: string;
}
