import { ReactNode, useContext, useState } from "react"
import EditorContext, { EditorState } from "./EditorContext"


const defaultEditorState: EditorState = {
    openFiles: {},
    openTabs: [],
    activeFile: null,
};
const EditorProvider = ({ children }: { children: ReactNode }) => {
    const [codeLang, setCodeLang] = useState<string | null>(null);
    const [editorState, setEditorState] = useState<EditorState>(defaultEditorState);

    const getDirtyStatus = () => {
        return editorState.activeFile
            ? editorState.openFiles[editorState.activeFile]?.isDirty ?? false
            : false;
    };

    return (
        <EditorContext.Provider
            value={{
                codeLang,
                setCodeLang,
                editorState,
                setEditorState,
                getDirtyStatus,
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
