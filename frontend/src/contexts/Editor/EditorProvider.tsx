import { ReactNode, useContext, useState } from "react"
import EditorContext, { EditorState } from "./EditorContext"
import { FileInfo } from "../../components/FileEx/FileActions";


const defaultEditorState: EditorState = {
    openFiles: {},
    openTabs: [],
    activeFile: null,
};
const EditorProvider = ({ children }: { children: ReactNode }) => {
    const [codeLang, setCodeLang] = useState<string | null>(null);
    const [editorState, setEditorState] = useState<EditorState>(defaultEditorState);

    const getDirtyStatus = (): boolean => {
        return editorState.activeFile
            ? editorState.openFiles[editorState.activeFile]?.isDirty ?? false
            : false;
    };
    const getCurrentFileName = (): string | null => {
        return editorState.activeFile
            ? editorState.openFiles[editorState.activeFile]?.fileInfo.name ?? "ERROR"
            : "ERROR";
    };
    const getCurrentFileInfo = (): FileInfo | null => {
        const path = editorState.activeFile;

        if (!path) return null;

        return editorState.openFiles[path]?.fileInfo ?? null;
    };
    return (
        <EditorContext.Provider
            value={{
                codeLang,
                setCodeLang,
                editorState,
                setEditorState,
                getDirtyStatus,
                getCurrentFileName,
                getCurrentFileInfo
            }}
        >
            {children}
        </EditorContext.Provider>
    );
};

export default EditorProvider

export const useEditorContext = () => {
    const context = useContext(EditorContext);
    if (context === undefined) {
        throw new Error('EditorContext is not undefined !!');
    }
    return context;
}
