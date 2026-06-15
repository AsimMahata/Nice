import { useEffect, useState } from "react";

import "./Home.css"; 

import { useFileActions } from "../../components/FileEx/FileActions";
import { useWorkspaceContext } from "../../contexts/Workspace/WorkspaceProvider";
import ActivityBar from "../../components/Body/ActivityBar/ActivityBar";
import MainBody from "../../components/Body/MainBody/MainBody";
import Header from "../../components/Body/Header/Header";

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

function Home() {

    const { currentPath, setCurrentActivity, setSidePanel, setCwd } = useWorkspaceContext();
    const [isDev, _setAsim] = useState(true);
    console.log('rendered Home')

    useEffect(() => {
        if (isDev) setCwd(import.meta.env.VITE_TESTING_FOLDER);
    }, []);


    // TODO: can Anyone Move this to another component
    const FileActions = useFileActions()

    

    const handleCPHProblem = async (data: any) => {
        const formattedName = data.name
            .replace(/[.\s]/g, "_") // Replaces '.' and ' ' with '_'
            .replace(/_+/g, "_") // Collapses consecutive '_' into one
            .replace(/^_|_$/g, ""); // Removes leading/trailing underscores

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
            console.error(error);
        }
    };

    useEffect(() => {
        if (window.cph) {
            const unsubscribe = window.cph.onProblem((data: any) => {
                console.log("New Problem:", data.name);
                handleCPHProblem(data);
            });
            return () => {
                unsubscribe();
            };
        }
    }, [FileActions]);


    return (
        <div className="ide-container">
            <Header />
            <div className="main-body">
                <ActivityBar />
                <MainBody />
            </div>
        </div >
    );
}

export default Home;
