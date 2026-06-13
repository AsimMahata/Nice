import { useState } from "react";
import EditorSettings from "./EditorSettings";
import UserSettings from "./UserSettings";
import AppearanceSettings from "./AppearanceSettings";
import SnippetsSettings from "./SnippetsSettings";
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
                        Editor
                    </li>
                    <li className={activeTab === "appearance" ? "active" : ""} onClick={() => setActiveTab("appearance")}>
                        Appearance
                    </li>
                    <li className={activeTab === "files" ? "active" : ""} onClick={() => setActiveTab("files")}>
                        Files
                    </li>
                    <li className={activeTab === "snippets" ? "active" : ""} onClick={() => setActiveTab("snippets")}>
                        Snippets
                    </li>
                    <li className={activeTab === "cph" ? "active" : ""} onClick={() => setActiveTab("cph")}>
                        Competitive Programming
                    </li>
                    <li className={activeTab === "advanced" ? "active" : ""} onClick={() => setActiveTab("advanced")}>
                        Advanced
                    </li>
                    <li style={{ marginTop: "20px", opacity: 0.8 }} className={activeTab === "user" ? "active" : ""} onClick={() => setActiveTab("user")}>
                        User Settings
                    </li>
                </ul>
            </div>
            <div className="settings-content" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                {activeTab === "editor" && <EditorSettings />}
                {activeTab === "appearance" && <AppearanceSettings />}
                {activeTab === "snippets" && <SnippetsSettings />}
                {activeTab === "user" && <UserSettings />}
                {["files", "cph", "advanced"].includes(activeTab) && (
                    <div className="settings-section">
                        <h3>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Settings</h3>
                        <p style={{ color: "var(--label-color)" }}>These settings are not yet implemented but the architecture is ready for them.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsView;
