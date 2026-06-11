import React, { createContext } from "react";
interface OpenFile {
    content: string,
    isDirty: boolean
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
    getDirtyStatus: () => boolean;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined)

export default EditorContext




