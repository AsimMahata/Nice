import { useEffect, useState, useRef } from "react";
import Editor from "@monaco-editor/react";
import { SyncSettingsBanner } from "./SyncSettingsBanner";

const SnippetsSettings = () => {
    const [language, setLanguage] = useState<string>("cpp");
    const [rawSnippets, setRawSnippets] = useState<string>("");
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const editorRef = useRef<any>(null);

    const languages = [
        "cpp", "python", "java", "c"
    ];

    // Load snippet json from backend
    useEffect(() => {
        const loadSnippets = async () => {
            if (window.snippets) {
                const data = await window.snippets.getSnippetsRaw(language);
                setRawSnippets(data);
            }
        };
        loadSnippets();
    }, [language]);

    const handleSave = async () => {
        if (!window.snippets) return;
        setIsSaving(true);

        const currentValue = editorRef.current ? editorRef.current.getValue() : rawSnippets;

        const success = await window.snippets.saveSnippetsRaw(language, currentValue);
        if (success) {
            alert(`Snippets for ${language} saved successfully!`);
        } else {
            alert("Failed to save snippets. Please ensure the JSON is valid.");
        }
        setIsSaving(false);
    };

    const handleMount = (editor: any) => {
        editorRef.current = editor;
    };

    return (
        <div className="settings-section" style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
            <h3>Snippets Settings</h3>
            <p style={{ color: "var(--label-color)", marginBottom: "20px" }}>
                Create your own code snippets. Select a language to edit its snippets.json file.
            </p>

            <div className="setting-item" style={{ marginBottom: "20px" }}>
                <label>Language</label>
                <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    style={{ width: "200px" }}
                >
                    {languages.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                    ))}
                </select>
            </div>

            <div style={{ flex: 1, minHeight: "400px", border: "1px solid var(--border-color)", borderRadius: "4px", overflow: "hidden" }}>
                <Editor
                    height="100%"
                    language="json"
                    theme="vs-dark"
                    value={rawSnippets}
                    onMount={handleMount}
                    options={{
                        minimap: { enabled: false },
                        tabSize: 4,
                        insertSpaces: true,
                    }}
                />
            </div>

            <div style={{ marginTop: "20px" }}>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{
                        backgroundColor: "var(--accent-color, #007acc)",
                        color: "white",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "3px",
                        cursor: "pointer",
                        fontSize: "0.9rem"
                    }}
                >
                    {isSaving ? "Saving..." : "Save Snippets"}
                </button>
            </div>

            <SyncSettingsBanner sectionName="Snippets" />
        </div>
    );
};

export default SnippetsSettings;
