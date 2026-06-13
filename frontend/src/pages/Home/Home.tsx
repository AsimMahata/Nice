import { useEffect, useState } from "react";

import "./Home.css"; // Import the new CSS file

import { useFileActions } from "../../components/FileEx/FileActions";
import { useWorkspaceContext } from "../../contexts/Workspace/WorkspaceProvider";
import ActivityBar from "../../components/Body/ActivityBar/ActivityBar";
import MainBody from "../../components/Body/MainBody/MainBody";
import Header from "../../components/Body/Header/Header";

declare global {
    interface Window {
        cph?: {
            onProblem: (callback: (data: any) => void) => () => void;
        };
    }
}

function Home() {
    //contexts
    const { setCwd, currentPath } = useWorkspaceContext()
    const [isDev, _setAsim] = useState(true);
    console.log('rendered Home')

    useEffect(() => {
        if (isDev) setCwd(import.meta.env.VITE_TESTING_FOLDER);
    }, []);



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
            }
            console.log('FileActions.currentPath from home ---', currentPath);
        } catch (error) {
            console.error(error);
        }
        console.log("created file and now ......");
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
