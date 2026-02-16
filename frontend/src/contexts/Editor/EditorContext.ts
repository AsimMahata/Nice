import React, { createContext } from "react";

interface EditorContextType {
    codeLang: string | null,
    setCodeLang: React.Dispatch<React.SetStateAction<string | null>>,
    isDirty: boolean,
    setIsDirty: React.Dispatch<React.SetStateAction<boolean>>,
}
const EditorContext = createContext<EditorContextType | undefined>(undefined)

export default EditorContext
