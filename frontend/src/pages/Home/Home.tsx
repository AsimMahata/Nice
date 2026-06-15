import { useEffect, useState } from "react";

import "./Home.css"; 

import { useWorkspaceContext } from "../../contexts/Workspace/WorkspaceProvider";
import ActivityBar from "../../components/Body/ActivityBar/ActivityBar";
import MainBody from "../../components/Body/MainBody/MainBody";
import Header from "../../components/Body/Header/Header";
import { useCphProblemListener } from "../../utils/useCphProblemListener";



function Home() {

    const { setCwd } = useWorkspaceContext();
    const [isDev, _setAsim] = useState(true);
    console.log('rendered Home')

    useEffect(() => {
        if (isDev) setCwd(import.meta.env.VITE_TESTING_FOLDER);
    }, []);

    useCphProblemListener();


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
