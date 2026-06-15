import { useEffect } from "react";
import { useFileActions } from "../components/FileEx/FileActions";
import { useWorkspaceContext } from "../contexts/Workspace/WorkspaceProvider";

declare global {
    interface Window {
        cph?: {
            onProblem: (callback: (data: any) => void) => () => void;
            compile: (filePath: string) => Promise<{ success: boolean; error?: string; binaryPath?: string }>;
            runTestcase: (binaryPath: string, input: string, timeLimit: number) => Promise<{
                stdout: string;
                stderr: string;
                exitCode: number | null;
                time: number;
                timeout: boolean;
                error?: string;
            }>;
        };
    }
}

export function useCphProblemListener() {
    const FileActions = useFileActions();
    const { currentPath, setCurrentActivity, setSidePanel } = useWorkspaceContext();

    useEffect(() => {
        if (!window.cph) return;

        const handleCPHProblem = async (data: any) => {
            const formattedName = data.name
                .replace(/[.\s]/g, "_")    // Replaces '.' and ' ' with '_'
                .replace(/_+/g, "_")       // Collapses consecutive '_' into one
                .replace(/^_|_$/g, "");    // Removes leading/trailing underscores

            const filename = `${formattedName}.cpp`;
            try {
                const fileInfo = await FileActions.createNewFiles(filename);
                if (fileInfo) {
                    await FileActions.handleClick(fileInfo);
                    
                    if (currentPath && window.fileSystem) {
                        const cphFolder = await window.fileSystem.join(currentPath, ".cph");
                        await window.fileSystem.createFolder(cphFolder);
                        
                        // Create test case JSON structure
                        const cphJsonPath = await window.fileSystem.join(cphFolder, `${filename}.json`);
                        const cphData = {
                            name: data.name,
                            timeLimit: data.timeLimit || 2000,
                            tests: data.tests.map((test: any, index: number) => ({
                                id: index + 1,
                                input: test.input,
                                expectedOutput: test.output
                            }))
                        };
                        
                        await window.fileSystem.writeFileContent(cphJsonPath, JSON.stringify(cphData, null, 2));
                    }
                }

                setCurrentActivity("CPH");
                setSidePanel(true);
            } catch (error) {
                console.error("Error in CPH problem listener:", error);
            }
        };

        const unsubscribe = window.cph.onProblem((data: any) => {
            console.log("New Problem received via Competitive Companion:", data.name);
            handleCPHProblem(data);
        });

        return () => {
            unsubscribe();
        };
    }, [FileActions, currentPath, setCurrentActivity, setSidePanel]);
}
