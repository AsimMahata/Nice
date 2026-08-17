import React, { createContext } from "react";
import { FileInfo } from "../../services/FileSystem/file.options";

interface OpenedFile {
    isDirty: boolean
    fileInfo: FileInfo
}

export interface EditorState {
    openedFiles: Record<string, OpenedFile>;
    openedTabs: string[];
    activeFile: string | null;
}

interface EditorContextType {
    codeLang: string | null;
    setCodeLang: React.Dispatch<React.SetStateAction<string | null>>;

    editorState: EditorState;
    setEditorState: React.Dispatch<React.SetStateAction<EditorState>>;
    buffersRef: React.RefObject<Record<string, string>>;
    editorStateRef: React.RefObject<EditorState>;

    getDirtyStatus: () => boolean;
    getCurrentFileName: () => string | null;
    getCurrentFileInfo: () => FileInfo | null;
    openFile: (file: FileInfo) => Promise<void>
    saveActiveFile: () => Promise<boolean>
}

const EditorContext = createContext<EditorContextType | undefined>(undefined)

export default EditorContext




