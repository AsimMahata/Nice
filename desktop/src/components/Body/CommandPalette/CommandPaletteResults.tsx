import { FileCode2, Terminal, Palette } from "lucide-react";
import { useEditorContext } from "../../../contexts/Editor/EditorProvider";
import { useSettingsContext } from "../../../contexts/Settings/SettingsProvider";
import { useWorkspaceContext } from "../../../contexts/Workspace/WorkspaceProvider";
import { FileInfo } from "../../../services/FileSystem/file.options";
import "./CommandPalette.css";
import { commandPaletteManager } from "./CommandPaletteManager";
import { paletteItem } from "./palette.types";

type Props = {
    results: paletteItem[];
};

const CommandPaletteResults = ({ results }: Props) => {
    const { openFile, saveActiveFile } = useEditorContext();
    const { updateAppearanceSettings } = useSettingsContext();
    const { setIsTerminalOpen } = useWorkspaceContext();

    const handleClick = async (item: paletteItem) => {
        console.log('clicked on item', item);
        if (item.type === "File") {
            if (item.payload) {
                await openFile(item.payload as FileInfo);
            }
        } else if (item.type === "Theme") {
            if (item.payload) {
                updateAppearanceSettings({ theme: item.payload as string });
            }
        } else if (item.type === "Command") {
            if (item.payload === "terminal.toggle") {
                setIsTerminalOpen((prev) => !prev);
            } else if (item.payload === "file.save") {
                await saveActiveFile();
            }
        }
        commandPaletteManager.hideCommadPalette();
    };

    return (
        <div className="command-palette-results-container">
            {results.length === 0 ? (
                <div className="command-palette-results-empty">
                    No matching files or commands found
                </div>
            ) : (
                results.map((item, index) => (
                    <div
                        key={`${item.title}-${index}`}
                        className="command-palette-result-item"
                        onClick={() => handleClick(item)}
                    >
                        {item.type === "File" ? (
                            <FileCode2 size={16} style={{ color: "var(--accent-light)", flexShrink: 0 }} />
                        ) : item.type === "Theme" ? (
                            <Palette size={16} style={{ color: "var(--accent-light)", flexShrink: 0 }} />
                        ) : (
                            <Terminal size={16} style={{ color: "var(--status-info)", flexShrink: 0 }} />
                        )}
                        <div className="command-palette-result-info">
                            <div className="command-palette-result-name">
                                {item.title}
                            </div>
                            {item.secondaryTitle && (
                                <div className="command-palette-result-path">
                                    {item.secondaryTitle}
                                </div>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default CommandPaletteResults;
