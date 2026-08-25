import { ReactNode, useContext, useState } from "react";
import CodeActionContext, { CodeActionResult } from "./CodeActionContext";

export const CodeActionProvider = ({ children }: { children: ReactNode }) => {
    const [codeActionResult, setCodeActionResult] = useState<CodeActionResult | null>(null);
    const [isCodeActionRunning, setIsCodeActionRunning] = useState<boolean>(false);
    const [codeActionInput, setCodeActionInput] = useState<string>("");

    return (
        <CodeActionContext.Provider
            value={{
                codeActionResult,
                setCodeActionResult,
                isCodeActionRunning,
                setIsCodeActionRunning,
                codeActionInput,
                setCodeActionInput,
            }}
        >
            {children}
        </CodeActionContext.Provider>
    );
};

export const useCodeActionContext = () => {
    const context = useContext(CodeActionContext);
    if (context === undefined) {
        throw new Error("useCodeActionContext must be used within a CodeActionProvider");
    }
    return context;
};

export default CodeActionProvider;
