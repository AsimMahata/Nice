import { Folder, FileCode, FileText, FileJson, File } from "lucide-react";
import { FileInfo } from "../../services/FileSystem/file.options";

type Props = {
    handleClick: (value: FileInfo) => void;
    file: FileInfo;
};

const getFileIcon = (file: FileInfo) => {
    if (file.isDirectory) {
        return <Folder size={15} style={{ color: "var(--accent-light)", flexShrink: 0 }} />;
    }
    const ext = file.extension?.toLowerCase() || "";
    if ([".cpp", ".c", ".py", ".java", ".js", ".ts", ".tsx", ".jsx", ".html", ".css"].includes(ext)) {
        return <FileCode size={15} style={{ color: "var(--status-info)", flexShrink: 0 }} />;
    }
    if ([".json", ".yaml", ".yml", ".toml"].includes(ext)) {
        return <FileJson size={15} style={{ color: "var(--status-warning)", flexShrink: 0 }} />;
    }
    if ([".md", ".txt", ".doc"].includes(ext)) {
        return <FileText size={15} style={{ color: "var(--text-secondary)", flexShrink: 0 }} />;
    }
    return <File size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />;
};

const FileItem = ({ handleClick, file }: Props) => {
    return (
        <div
            className={`file-ex-item ${file.isDirectory ? "dir" : "file"}`}
            onClick={() => handleClick(file)}
            title={file.path}
        >
            {getFileIcon(file)}
            <span className="file-name">{file.name}</span>
        </div>
    );
};

export default FileItem;
