import { FileInfo, useFileActions } from "../../FileEx/FileActions";
import "./CommandPalette.css";
import { paletteItem } from "./CommandPaletteManager";

type Props = {
    results: paletteItem[];
};

//TODO: after the file is clicked the query should disspear fix it 
const CommandPaletteResults = ({ results }: Props) => {
    const FileActions = useFileActions()

    const handleClick = async (item: paletteItem) => {
        console.log('clicked on item', item)
        if (item.type === "File") {
            if (!item.payload) return;
            await FileActions.handleClick(item.payload as FileInfo)
        }
    }

    return (
        <div className="command-palette-results-container">
            {results.length === 0 ? (
                <div className="command-palette-results-empty">
                    No matching results
                </div>
            ) : (
                results.map((item, index) => (
                    <div
                        key={`${item.title}-${index}`}
                        className="command-palette-result-item"
                        onClick={() => handleClick(item)}
                    >
                        <div className="command-palette-result-name" >
                            {item.title}
                        </div>

                        {
                            item.secondaryTitle && (
                                <div className="command-palette-result-path">
                                    {item.secondaryTitle}
                                </div>
                            )
                        }
                    </div>
                ))
            )}
        </div >
    );
};

export default CommandPaletteResults;
