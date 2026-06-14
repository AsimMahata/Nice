import { FileInfo } from "../../../Types/filesystem";
import { useFileActions } from "../../FileEx/FileActions";
import "./SearchList.css";

type Props = {
    results: FileInfo[];
};

const SearchList = ({ results }: Props) => {
    const FileActions = useFileActions()
    return (
        <div className="search-results-container">
            {results.length === 0 ? (
                <div className="search-results-empty">
                    No matching files
                </div>
            ) : (
                results.map((file) => (
                    <div
                        key={file.path}
                        className="search-result-item"
                        onClick={() => FileActions.handleClick(file)} //FIX: its not working I want to open it in tab will fix later 
                    >
                        <div className="search-result-name">
                            {file.name}
                        </div>

                        <div className="search-result-path">
                            {file.path}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default SearchList;
