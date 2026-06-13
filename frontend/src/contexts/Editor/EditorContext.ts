import React, { createContext } from "react";
import { FileInfo } from "../../components/FileEx/FileActions";
interface OpenFile {
    isDirty: boolean
    fileInfo: FileInfo
}

export interface EditorState {
    openFiles: Record<string, OpenFile>;
    openTabs: string[];
    activeFile: string | null;
}
interface EditorContextType {
    codeLang: string | null;
    setCodeLang: React.Dispatch<React.SetStateAction<string | null>>;

    editorState: EditorState;
    setEditorState: React.Dispatch<React.SetStateAction<EditorState>>;
    buffersRef: React.RefObject<Record<string, string>>;
    getDirtyStatus: () => boolean;
    getCurrentFileName: () => string | null;
    getCurrentFileInfo: () => FileInfo | null;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined)

export default EditorContext




