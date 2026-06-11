import {
    FolderIcon,
    Search,
    Github,
    Terminal as TERMLOGO,
    Settings,
    User,
} from "lucide-react";
import { useState } from "react";
import { useEditorContext } from "../../../contexts/Editor/EditorProvider";
import FileEx from "../../FileEx/FileEx";
import UserDetails from "../../User/UserDetails";

const ActivityBar = () => {
    //contexts
    const { getCurrentFileInfo } = useEditorContext()
    const [sidePanel, setSidePanle] = useState<boolean>(false); // is side panel visible or not

    const [currentActivity, setCurrentActivity] = useState<string | null>(
        "file-ex",
    ); // what is the current active button on side panel
    const handleActivityClickEvent = (name: string) => {
        if (!name) setSidePanle(false);
        if (currentActivity == name) {
            console.log(
                "frontend/home/handleActivityClickEvent/ to check its already active ",
            );
            setSidePanle((p) => !p);
            return;
        }
        setCurrentActivity(name);
        setSidePanle(true);
        console.log("current active section in frontend home ", name);
    };
    const ActivityIcon = ({ name, icon }: any) => (
        <div
            className={`activity-icon-btn ${currentActivity == name ? "active" : ""}`}
            onClick={() => handleActivityClickEvent(name)}>
            {icon}
        </div>
    );


    function getCorrectActivitybar() {
        switch (currentActivity) {
            case "FileEx":
                return (
                    <FileEx
                        codeFile={getCurrentFileInfo()}
                    />
                );
            case "Search":
                return <div> Search</div>;
            case "Github":
                return <div> Github</div>;
            case "CodeAction":
                return <div> CodeAction </div>;
            case "User":
                return <UserDetails />;
            case "Settings":
                return <div> Settings</div>;
            default:
                return null;
        }
    }

    return (
        <>
            <aside className="activity-bar">
                <div className="icon-stack">
                    <ActivityIcon name={"FileEx"} icon={<FolderIcon size={22} />} />
                    <ActivityIcon name={"Search"} icon={<Search size={22} />} />
                    <ActivityIcon name={"Github"} icon={<Github size={22} />} />
                    <ActivityIcon name={"CodeAction"} icon={<TERMLOGO size={22} />} />
                </div>
                <div className="icon-stack">
                    <ActivityIcon name={"User"} icon={<User size={22} />} />
                    <ActivityIcon name={"Settings"} icon={<Settings size={22} />} />
                </div>
            </aside>
            <div
                className="current-activity"
                style={{ display: (sidePanel ? "block" : "none"), minWidth: "40vh" }}>
                {getCorrectActivitybar()}
            </div>
        </>
    )
}

export default ActivityBar
