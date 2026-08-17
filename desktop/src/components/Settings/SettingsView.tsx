import { useState } from "react";
import { Code, Palette, Files as FilesIcon, Scissors, Trophy, Sliders, User } from "lucide-react";
import EditorSettings from "./EditorSettings";
import UserSettings from "./UserSettings";
import AppearanceSettings from "./AppearanceSettings";
import SnippetsSettings from "./SnippetsSettings";
import FileSettings from "./FileSettings";
import "./Settings.css";

type SettingsTab = "editor" | "appearance" | "files" | "snippets" | "cph" | "advanced" | "user";

const SettingsView = () => {
    const [activeTab, setActiveTab] = useState<SettingsTab>("editor");

    return (
        <div className="settings-container">
            <div className="settings-sidebar">
                <h2 className="settings-title">Settings</h2>
                <ul className="settings-nav">
                    <li className={activeTab === "editor" ? "active" : ""} onClick={() => setActiveTab("editor")}>
                        <Code size={16} />
                        <span>Editor</span>
                    </li>
                    <li className={activeTab === "appearance" ? "active" : ""} onClick={() => setActiveTab("appearance")}>
                        <Palette size={16} />
                        <span>Appearance</span>
                    </li>
                    <li className={activeTab === "files" ? "active" : ""} onClick={() => setActiveTab("files")}>
                        <FilesIcon size={16} />
                        <span>Files</span>
                    </li>
                    <li className={activeTab === "snippets" ? "active" : ""} onClick={() => setActiveTab("snippets")}>
                        <Scissors size={16} />
                        <span>Snippets</span>
                    </li>
                    <li className={activeTab === "cph" ? "active" : ""} onClick={() => setActiveTab("cph")}>
                        <Trophy size={16} />
                        <span>Competitive Prog.</span>
                    </li>
                    <li className={activeTab === "advanced" ? "active" : ""} onClick={() => setActiveTab("advanced")}>
                        <Sliders size={16} />
                        <span>Advanced</span>
                    </li>
                    <li className={activeTab === "user" ? "active" : ""} onClick={() => setActiveTab("user")}>
                        <User size={16} />
                        <span>User Account</span>
                    </li>
                </ul>
            </div>
            <div className="settings-content">
                {activeTab === "editor" && <EditorSettings />}
                {activeTab === "appearance" && <AppearanceSettings />}
                {activeTab === "snippets" && <SnippetsSettings />}
                {activeTab === "files" && <FileSettings />}
                {activeTab === "user" && <UserSettings />}
                {["cph", "advanced"].includes(activeTab) && (
                    <div className="settings-section">
                        <h3>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Settings</h3>
                        <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Additional configuration options for {activeTab} will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsView;
