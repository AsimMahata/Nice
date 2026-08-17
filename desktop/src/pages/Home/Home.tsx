import "./Home.css";
import ActivityBar from "../../components/Body/ActivityBar/ActivityBar";
import MainBody from "../../components/Body/MainBody/MainBody";
import Header from "../../components/Body/Header/Header";
import { useCphProblemListener } from "../../utils/useCphProblemListener";
import { useKeyboardEventListener } from "../../core/Keybindings/keyboardEventListerner";

function Home() {
    console.log('rendered Home')

    useCphProblemListener();
    useKeyboardEventListener();
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
