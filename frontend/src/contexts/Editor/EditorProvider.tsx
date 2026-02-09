import { ReactNode, useContext, useState } from "react"
import EditorContext from "./EditorContext"



const EditorProvider = ({ children }: { children: ReactNode }) => {
    const [codeLang, setCodeLang] = useState<string | null>(null)
    const [isDirty, setIsDirty] = useState<boolean>(false)
    return (
        <EditorContext.Provider value={{ codeLang, setCodeLang, isDirty, setIsDirty }}>
            {children}
        </EditorContext.Provider>
    )
}

export default EditorProvider

export const useEditorContext = () => {
    const context = useContext(EditorContext);
    if (context === undefined) {
        throw new Error('EditorContext is not undefined !!');
    }
    return context;
}
