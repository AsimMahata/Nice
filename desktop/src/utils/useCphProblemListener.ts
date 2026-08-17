import { useEffect } from "react";
import { useWorkspaceContext } from "../contexts/Workspace/WorkspaceProvider";
import { fileSystem } from "../services/FileSystem/FileSystem";
import { FileInfo } from "../services/FileSystem/file.options";
import { useEditorContext } from "../contexts/Editor/EditorProvider";

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
    const { currentPath, setCurrentActivity, setSidePanel } = useWorkspaceContext();
    const { openFile } = useEditorContext();
    useEffect(() => {
        if (!window.cph) return;

        const handleCPHProblem = async (data: any) => {
            const formattedName = data.name
                .replace(/[.\s]/g, "_")    // Replaces '.' and ' ' with '_'
                .replace(/_+/g, "_")       // Collapses consecutive '_' into one
                .replace(/^_|_$/g, "");    // Removes leading/trailing underscores

            if (!currentPath) {
                throw new Error('Please Be inside A folder First To use CPH');
            }
            const filename = `${formattedName}.cpp`;
            try {
                const path = await fileSystem.join(currentPath, filename);

                await fileSystem.createNewFile(currentPath, filename);

                const fileInfo: FileInfo = await fileSystem.getFileInfo(path);

                if (fileInfo) {

                    await openFile(fileInfo);

                    if (currentPath) {
                        await fileSystem.createDirectory(currentPath, ".cph");
                        const cphFolder = await fileSystem.join(currentPath, ".cph");
                        // Create test case JSON structure
                        const cphJsonPath = await fileSystem.join(cphFolder, `${filename}.json`);
                        const cphData = {
                            name: data.name,
                            timeLimit: data.timeLimit || 2000,
                            tests: data.tests.map((test: any, index: number) => ({
                                id: index + 1,
                                input: test.input,
                                expectedOutput: test.output
                            }))
                        };

                        await fileSystem.writeFile(cphJsonPath, JSON.stringify(cphData, null, 2));
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
    }, [currentPath, setCurrentActivity, setSidePanel]);
}
