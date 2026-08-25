import { useEffect } from "react";
import { useWorkspaceContext } from "../contexts/Workspace/WorkspaceProvider";
import { fileSystem } from "../services/FileSystem/FileSystem";
import { FileInfo } from "../services/FileSystem/file.options";
import { useEditorContext } from "../contexts/Editor/EditorProvider";
import { commandPaletteManager } from "../components/Body/CommandPalette/CommandPaletteManager";
import { paletteItem } from "../components/Body/CommandPalette/palette.types";

export type CphExecutionStatus =
    | 'Accepted'
    | 'Compilation Error'
    | 'Runtime Error'
    | 'Time Limit Exceeded'
    | 'Memory Limit Exceeded'
    | 'Sandbox Error';

export interface CphCompileResult {
    success: boolean;
    error?: string;
    binaryPath?: string;
    backendFallback?: boolean;
    language?: string;
    code?: string;
}

export interface CphRunResult {
    stdout: string;
    stderr: string;
    exitCode: number | null;
    time: number;
    timeout: boolean;
    memoryExceeded?: boolean;
    error?: string;
    source?: 'local' | 'backend';
    status?: CphExecutionStatus;
}

declare global {
    interface Window {
        cph?: {
            onProblem: (callback: (data: any) => void) => () => void;
            compile: (filePath: string, language?: string) => Promise<CphCompileResult>;
            runTestcase: (binaryPath: string, input: string, timeLimit: number, language?: string, code?: string) => Promise<CphRunResult>;
        };
    }
}

export function useCphProblemListener() {
    const { currentPath, setCurrentActivity, setSidePanel } = useWorkspaceContext();
    const { openFile } = useEditorContext();

    useEffect(() => {
        if (!window.cph) return;

        const createProblemFile = async (formattedName: string, ext: string, data: any) => {
            if (!currentPath) {
                throw new Error('Please Be inside A folder First To use CPH');
            }
            const filename = `${formattedName}.${ext}`;
            try {
                const path = await fileSystem.join(currentPath, filename);

                let fileInfo: FileInfo | null = null;
                try {
                    fileInfo = await fileSystem.getFileInfo(path);
                } catch {
                    fileInfo = null;
                }

                const fileExists = !!fileInfo;

                if (!fileExists) {
                    await fileSystem.createNewFile(currentPath, filename);

                    let starterCode = "";
                    if (ext === "cpp") {
                        starterCode = `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    return 0;\n}\n`;
                    } else if (ext === "c") {
                        starterCode = `#include <stdio.h>\n\nint main() {\n    return 0;\n}\n`;
                    } else if (ext === "py") {
                        starterCode = `import sys\n\ndef main():\n    pass\n\nif __name__ == '__main__':\n    main()\n`;
                    } else if (ext === "java") {
                        starterCode = `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        \n    }\n}\n`;
                    }

                    if (starterCode) {
                        await fileSystem.writeFile(path, starterCode);
                    }

                    fileInfo = await fileSystem.getFileInfo(path);
                }

                if (fileInfo) {
                    await openFile(fileInfo);

                    if (currentPath) {
                        await fileSystem.createDirectory(currentPath, ".cph");
                        const cphFolder = await fileSystem.join(currentPath, ".cph");
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
                console.error("Error handling CPH problem file:", error);
            }
        };

        const handleCPHProblem = async (data: any) => {
            const formattedName = data.name
                .replace(/[.\s]/g, "_")    // Replaces '.' and ' ' with '_'
                .replace(/_+/g, "_")       // Collapses consecutive '_' into one
                .replace(/^_|_$/g, "");    // Removes leading/trailing underscores

            if (!currentPath) {
                console.error('Please Be inside A folder First To use CPH');
                return;
            }

            const languages = [
                { name: "C++", ext: "cpp" },
                { name: "Python", ext: "py" },
                { name: "C", ext: "c" },
                { name: "Java", ext: "java" },
            ];

            const options: paletteItem[] = languages.map((lang) => ({
                title: `${lang.name} (.${lang.ext})`,
                secondaryTitle: `Create ${formattedName}.${lang.ext} for ${data.name}`,
                type: "Language",
                onSelect: async () => {
                    commandPaletteManager.hideCommadPalette();
                    await createProblemFile(formattedName, lang.ext, data);
                },
            }));

            await commandPaletteManager.showCustomOptions(options);
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
