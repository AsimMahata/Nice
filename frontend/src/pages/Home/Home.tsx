import { useEffect, useState } from "react";

import "./Home.css"; // Import the new CSS file

import { useFileActions } from "../../components/FileEx/FileActions";
import { useSocket } from "../../utils/useSocket";
import { useWorkspaceContext } from "../../contexts/Workspace/WorkspaceProvider";
import ActivityBar from "../../components/Body/ActivityBar/ActivityBar";
import MainBody from "../../components/Body/MainBody/MainBody";
import Header from "../../components/Body/Header/Header";

function Home() {
    //contexts
    const { setCwd, currentPath } = useWorkspaceContext()
    const [isDev, _setAsim] = useState(true);


    useEffect(() => {
        if (isDev) setCwd(import.meta.env.VITE_TESTING_FOLDER);
    }, []);



    const FileActions = useFileActions()

    const socket = useSocket();

    const handleCPHProblem = async (data: any) => {
        const formattedName = data.name
            .replace(/[.\s]/g, "_") // Replaces '.' and ' ' with '_'
            .replace(/_+/g, "_") // Collapses consecutive '_' into one
            .replace(/^_|_$/g, ""); // Removes leading/trailing underscores

        const filename = `${formattedName}.cpp`;
        try {
            await FileActions.createNewFiles(filename);
            console.log('FileActions.currentPath from home ---', currentPath);
            // FileActions.setCurrentPath()
            // need to open file and than set lang so that it loads placeholder by useEffect
        } catch (error) {
            console.error(error);
        }
        console.log("created file and now ......");
    };

    useEffect(() => {
        socket.on("cph_problem", (data: any) => {
            console.log("New Problem:", data.name);
            handleCPHProblem(data);
        });
        return () => {
            socket.off("cph_problem");
        };
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
