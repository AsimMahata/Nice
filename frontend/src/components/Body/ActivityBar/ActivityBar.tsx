import {
    FolderIcon,
    Search,
    Github,
    Terminal as TERMLOGO,
    Settings,
    User,
    Trophy,
} from "lucide-react";
import { useEditorContext } from "../../../contexts/Editor/EditorProvider";
import { useWorkspaceContext } from "../../../contexts/Workspace/WorkspaceProvider";
import FileEx from "../../FileEx/FileEx";
import UserDetails from "../../User/UserDetails";
import CphPanel from "../../CphPanel/CphPanel.tsx";

const ActivityBar = () => {
    const { getCurrentFileInfo } = useEditorContext();
    
    const { sidePanel, setSidePanel, currentActivity, setCurrentActivity } = useWorkspaceContext();

    const handleActivityClickEvent = (name: string) => {
        if (!name) setSidePanel(false);
        if (currentActivity === name) {
            setSidePanel((p) => !p);
            return;
        }
        setCurrentActivity(name);
        setSidePanel(true);
    };

    const ActivityIcon = ({ name, icon }: any) => (
        <div
            className={`activity-icon-btn ${currentActivity === name ? "active" : ""}`}
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
            case "CPH":
                return <CphPanel />;
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
                    <ActivityIcon name={"CPH"} icon={<Trophy size={22} />} />
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
    );
};

export default ActivityBar;