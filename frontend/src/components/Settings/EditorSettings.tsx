import { useSettingsContext } from "../../contexts/Settings/SettingsProvider";
import { EditorSettings as IEditorSettings } from "../../contexts/Settings/SettingsContext";
import { SyncSettingsBanner } from "./SyncSettingsBanner";

const EditorSettings = () => {
    const { settings, updateEditorSettings } = useSettingsContext();
    const editor = settings.editor;

    const handleChange = (key: keyof IEditorSettings, value: any) => {
        updateEditorSettings({ [key]: value });
    };

    return (
        <div className="settings-section">
            <h3>Editor Settings</h3>

            <div className="setting-item">
                <label>Font Family</label>
                <select
                    value={editor.fontFamily}
                    onChange={(e) => handleChange("fontFamily", e.target.value)}
                >
                    <option value="Consolas, 'Courier New', monospace">Consolas / Courier New</option>
                    <option value="'Fira Code', monospace">Fira Code</option>
                    <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                    <option value="'Roboto Mono', monospace">Roboto Mono</option>
                    <option value="'Source Code Pro', monospace">Source Code Pro</option>
                    <option value="'Ubuntu Mono', monospace">Ubuntu Mono</option>
                </select>
            </div>

            <div className="setting-item">
                <label>Font Size</label>
                <input
                    type="number"
                    value={editor.fontSize}
                    onChange={(e) => handleChange("fontSize", parseInt(e.target.value) || 14)}
                    min={8}
                    max={100}
                />
            </div>

            <div className="setting-item">
                <label>Font Weight</label>
                <select
                    value={editor.fontWeight}
                    onChange={(e) => handleChange("fontWeight", e.target.value)}
                >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="100">100</option>
                    <option value="200">200</option>
                    <option value="300">300</option>
                    <option value="400">400</option>
                    <option value="500">500</option>
                    <option value="600">600</option>
                    <option value="700">700</option>
                    <option value="800">800</option>
                    <option value="900">900</option>
                </select>
            </div>

            <div className="setting-item">
                <label>Line Height</label>
                <input
                    type="number"
                    value={editor.lineHeight}
                    onChange={(e) => handleChange("lineHeight", parseInt(e.target.value) || 0)}
                    min={0}
                    step={1}
                />
                <small style={{ color: "var(--label-color)", marginTop: "4px" }}>0 means automatically computed from font size.</small>
            </div>

            <div className="setting-item">
                <label>Letter Spacing</label>
                <input
                    type="number"
                    value={editor.letterSpacing}
                    onChange={(e) => handleChange("letterSpacing", parseFloat(e.target.value) || 0)}
                    step={0.5}
                />
            </div>

            <div className="setting-item">
                <label>Cursor Blinking</label>
                <select
                    value={editor.cursorBlinking}
                    onChange={(e) => handleChange("cursorBlinking", e.target.value)}
                >
                    <option value="blink">Blink</option>
                    <option value="smooth">Smooth</option>
                    <option value="phase">Phase</option>
                    <option value="expand">Expand</option>
                    <option value="solid">Solid</option>
                </select>
            </div>

            <div className="setting-item">
                <label>Cursor Smooth Caret Animation</label>
                <select
                    value={editor.cursorSmoothCaretAnimation}
                    onChange={(e) => handleChange("cursorSmoothCaretAnimation", e.target.value)}
                >
                    <option value="off">Off</option>
                    <option value="on">On</option>
                    <option value="explicit">Explicit</option>
                </select>
            </div>

            <div className="setting-item">
                <label>Tab Size</label>
                <input
                    type="number"
                    value={editor.tabSize}
                    onChange={(e) => handleChange("tabSize", parseInt(e.target.value) || 4)}
                    min={1}
                    max={16}
                />
            </div>

            <div className="setting-item">
                <label>Word Wrap</label>
                <select
                    value={editor.wordWrap}
                    onChange={(e) => handleChange("wordWrap", e.target.value)}
                >
                    <option value="off">Off</option>
                    <option value="on">On</option>
                    <option value="wordWrapColumn">Word Wrap Column</option>
                    <option value="bounded">Bounded</option>
                </select>
            </div>

            <div className="setting-item">
                <label>Line Numbers</label>
                <select
                    value={editor.lineNumbers}
                    onChange={(e) => handleChange("lineNumbers", e.target.value)}
                >
                    <option value="on">On</option>
                    <option value="off">Off</option>
                    <option value="relative">Relative</option>
                    <option value="interval">Interval</option>
                </select>
            </div>

            <div className="setting-item">
                <label>Auto Closing Brackets</label>
                <select
                    value={editor.autoClosingBrackets}
                    onChange={(e) => handleChange("autoClosingBrackets", e.target.value)}
                >
                    <option value="always">Always</option>
                    <option value="languageDefined">Language Defined</option>
                    <option value="beforeWhitespace">Before Whitespace</option>
                    <option value="never">Never</option>
                </select>
            </div>

            <div className="setting-item">
                <label>Auto Closing Quotes</label>
                <select
                    value={editor.autoClosingQuotes}
                    onChange={(e) => handleChange("autoClosingQuotes", e.target.value)}
                >
                    <option value="always">Always</option>
                    <option value="languageDefined">Language Defined</option>
                    <option value="beforeWhitespace">Before Whitespace</option>
                    <option value="never">Never</option>
                </select>
            </div>

            <div className="setting-item checkbox">
                <input
                    type="checkbox"
                    checked={editor.fontLigatures}
                    onChange={(e) => handleChange("fontLigatures", e.target.checked)}
                />
                <label>Enable Font Ligatures</label>
            </div>

            <div className="setting-item checkbox">
                <input
                    type="checkbox"
                    checked={editor.minimap}
                    onChange={(e) => handleChange("minimap", e.target.checked)}
                />
                <label>Enable Minimap</label>
            </div>

            <div className="setting-item checkbox">
                <input
                    type="checkbox"
                    checked={editor.insertSpaces}
                    onChange={(e) => handleChange("insertSpaces", e.target.checked)}
                />
                <label>Insert Spaces</label>
            </div>

            <div className="setting-item checkbox">
                <input
                    type="checkbox"
                    checked={editor.formatOnSave}
                    onChange={(e) => handleChange("formatOnSave", e.target.checked)}
                />
                <label>Format On Save</label>
            </div>

            <div className="setting-item checkbox">
                <input
                    type="checkbox"
                    checked={editor.smoothScrolling}
                    onChange={(e) => handleChange("smoothScrolling", e.target.checked)}
                />
                <label>Smooth Scrolling</label>
            </div>

            <SyncSettingsBanner sectionName="Editor" />
        </div>
    );
};

export default EditorSettings;
