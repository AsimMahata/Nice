import { useSettingsContext } from "../../contexts/Settings/SettingsProvider";
import { FileInfo } from "../../services/FileSystem/file.options";
import { FileIcon, IconThemeMode } from "./FileIconProvider";

type Props = {
    handleClick: (value: FileInfo) => void;
    file: FileInfo;
    isOpen?: boolean;
};

const FileItem = ({ handleClick, file, isOpen = false }: Props) => {
    const { settings } = useSettingsContext();
    const iconTheme = (settings.appearance.iconTheme as IconThemeMode) || "material";

    return (
        <div
            className={`file-ex-item ${file.isDirectory ? "dir" : "file"}`}
            onClick={() => handleClick(file)}
            title={file.path}
        >
            <FileIcon file={file} iconTheme={iconTheme} isOpen={isOpen} />
            <span className="file-name">{file.name}</span>
        </div>
    );
};

export default FileItem;
