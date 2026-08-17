import React from "react";
import {
    Folder,
    FolderOpen,
    FileCode2,
    FileText,
    FileJson,
    FileImage,
    FileArchive,
    FileTerminal,
    FileCheck,
    FileCode,
    File
} from "lucide-react";
import { FileInfo } from "../../services/FileSystem/file.options";

export type IconThemeMode = "material" | "vs-seti" | "minimal";

interface FileIconProps {
    file: FileInfo;
    iconTheme?: IconThemeMode;
    isOpen?: boolean;
}

// 1. Material Icon Theme Renderer (Vibrant, colorful extension-specific SVG icons)
const renderMaterialIcon = (file: FileInfo, isOpen: boolean) => {
    if (file.isDirectory) {
        return isOpen ? (
            <FolderOpen size={16} style={{ color: "#f59e0b", flexShrink: 0 }} />
        ) : (
            <Folder size={16} style={{ color: "#eab308", flexShrink: 0 }} />
        );
    }

    const name = file.name.toLowerCase();
    const ext = (file.extension || "").toLowerCase();

    // Specific filenames
    if (name === ".gitignore" || name === ".gitattributes") {
        return <FileCheck size={16} style={{ color: "#f43f5e", flexShrink: 0 }} />;
    }
    if (name.startsWith(".env")) {
        return <FileCheck size={16} style={{ color: "#10b981", flexShrink: 0 }} />;
    }
    if (name.includes("docker") || name === "dockerfile") {
        return <FileTerminal size={16} style={{ color: "#38bdf8", flexShrink: 0 }} />;
    }

    // C++
    if (ext === ".cpp" || ext === ".cc" || ext === ".cxx" || ext === ".hpp" || ext === ".h") {
        return (
            <span
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 16,
                    height: 16,
                    borderRadius: 3,
                    background: "rgba(92, 141, 255, 0.2)",
                    border: "1px solid rgba(92, 141, 255, 0.4)",
                    color: "#60a5fa",
                    fontSize: "9px",
                    fontWeight: 800,
                    fontFamily: "monospace",
                    flexShrink: 0,
                }}
            >
                C+
            </span>
        );
    }

    // C
    if (ext === ".c") {
        return (
            <span
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 16,
                    height: 16,
                    borderRadius: 3,
                    background: "rgba(59, 130, 246, 0.2)",
                    border: "1px solid rgba(59, 130, 246, 0.4)",
                    color: "#3b82f6",
                    fontSize: "9px",
                    fontWeight: 800,
                    fontFamily: "monospace",
                    flexShrink: 0,
                }}
            >
                C
            </span>
        );
    }

    // Java
    if (ext === ".java" || ext === ".class" || ext === ".jar") {
        return (
            <span
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 16,
                    height: 16,
                    borderRadius: 3,
                    background: "rgba(234, 88, 12, 0.2)",
                    border: "1px solid rgba(234, 88, 12, 0.4)",
                    color: "#ea580c",
                    fontSize: "9px",
                    fontWeight: 800,
                    fontFamily: "monospace",
                    flexShrink: 0,
                }}
            >
                JV
            </span>
        );
    }

    // Python
    if (ext === ".py" || ext === ".ipynb" || ext === ".pyw") {
        return (
            <span
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 16,
                    height: 16,
                    borderRadius: 3,
                    background: "rgba(245, 192, 66, 0.2)",
                    border: "1px solid rgba(245, 192, 66, 0.4)",
                    color: "#facc15",
                    fontSize: "9px",
                    fontWeight: 800,
                    fontFamily: "monospace",
                    flexShrink: 0,
                }}
            >
                PY
            </span>
        );
    }

    // TypeScript / TSX
    if (ext === ".ts" || ext === ".tsx") {
        return (
            <span
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 16,
                    height: 16,
                    borderRadius: 3,
                    background: "rgba(49, 120, 198, 0.25)",
                    border: "1px solid rgba(49, 120, 198, 0.5)",
                    color: "#38bdf8",
                    fontSize: "9px",
                    fontWeight: 800,
                    fontFamily: "monospace",
                    flexShrink: 0,
                }}
            >
                {ext === ".tsx" ? "TX" : "TS"}
            </span>
        );
    }

    // JavaScript / JSX
    if (ext === ".js" || ext === ".jsx" || ext === ".mjs" || ext === ".cjs") {
        return (
            <span
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 16,
                    height: 16,
                    borderRadius: 3,
                    background: "rgba(247, 223, 30, 0.2)",
                    border: "1px solid rgba(247, 223, 30, 0.4)",
                    color: "#fde047",
                    fontSize: "9px",
                    fontWeight: 800,
                    fontFamily: "monospace",
                    flexShrink: 0,
                }}
            >
                JS
            </span>
        );
    }

    // HTML
    if (ext === ".html" || ext === ".htm") {
        return <FileCode2 size={16} style={{ color: "#f97316", flexShrink: 0 }} />;
    }

    // CSS / SCSS
    if (ext === ".css" || ext === ".scss" || ext === ".sass" || ext === ".less") {
        return <FileCode size={16} style={{ color: "#ec4899", flexShrink: 0 }} />;
    }

    // JSON / YAML / TOML
    if (ext === ".json" || ext === ".yaml" || ext === ".yml" || ext === ".toml") {
        return <FileJson size={16} style={{ color: "#fbbf24", flexShrink: 0 }} />;
    }

    // Markdown / Docs
    if (ext === ".md" || ext === ".markdown" || ext === ".txt") {
        return <FileText size={16} style={{ color: "#a7f3d0", flexShrink: 0 }} />;
    }

    // Images
    if ([".png", ".jpg", ".jpeg", ".svg", ".gif", ".webp", ".ico"].includes(ext)) {
        return <FileImage size={16} style={{ color: "#c084fc", flexShrink: 0 }} />;
    }

    // Archives
    if ([".zip", ".tar", ".gz", ".7z", ".rar"].includes(ext)) {
        return <FileArchive size={16} style={{ color: "#f472b6", flexShrink: 0 }} />;
    }

    // Shell / Batch
    if ([".sh", ".bash", ".ps1", ".bat", ".cmd"].includes(ext)) {
        return <FileTerminal size={16} style={{ color: "#4ade80", flexShrink: 0 }} />;
    }

    return <File size={16} style={{ color: "#94a3b8", flexShrink: 0 }} />;
};

// 2. VS Code Seti Icon Theme Renderer (Clean badge-style colored icons)
const renderSetiIcon = (file: FileInfo, isOpen: boolean) => {
    if (file.isDirectory) {
        return isOpen ? (
            <FolderOpen size={16} style={{ color: "#60a5fa", flexShrink: 0 }} />
        ) : (
            <Folder size={16} style={{ color: "#3b82f6", flexShrink: 0 }} />
        );
    }

    const ext = (file.extension || "").toLowerCase();

    if ([".cpp", ".c", ".cc", ".hpp", ".h"].includes(ext)) {
        return <FileCode2 size={16} style={{ color: "#60a5fa", flexShrink: 0 }} />;
    }
    if ([".py"].includes(ext)) {
        return <FileCode size={16} style={{ color: "#fde047", flexShrink: 0 }} />;
    }
    if ([".java", ".class", ".jar"].includes(ext)) {
        return <FileCode size={16} style={{ color: "#ea580c", flexShrink: 0 }} />;
    }
    if ([".ts", ".tsx"].includes(ext)) {
        return <FileCode size={16} style={{ color: "#38bdf8", flexShrink: 0 }} />;
    }
    if ([".js", ".jsx"].includes(ext)) {
        return <FileCode size={16} style={{ color: "#facc15", flexShrink: 0 }} />;
    }
    if ([".json", ".yaml", ".yml"].includes(ext)) {
        return <FileJson size={16} style={{ color: "#f97316", flexShrink: 0 }} />;
    }
    if ([".md", ".txt"].includes(ext)) {
        return <FileText size={16} style={{ color: "#818cf8", flexShrink: 0 }} />;
    }

    return <File size={16} style={{ color: "#64748b", flexShrink: 0 }} />;
};

// 3. Minimal Monochromatic Icon Theme Renderer (Ultra clean outline icons)
const renderMinimalIcon = (file: FileInfo, isOpen: boolean) => {
    if (file.isDirectory) {
        return isOpen ? (
            <FolderOpen size={16} style={{ color: "var(--text-secondary)", flexShrink: 0 }} />
        ) : (
            <Folder size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        );
    }

    const ext = (file.extension || "").toLowerCase();

    if ([".cpp", ".c", ".py", ".java", ".js", ".ts", ".tsx", ".jsx", ".html", ".css"].includes(ext)) {
        return <FileCode size={16} style={{ color: "var(--accent-light)", flexShrink: 0 }} />;
    }
    if ([".json", ".yaml", ".toml"].includes(ext)) {
        return <FileJson size={16} style={{ color: "var(--text-secondary)", flexShrink: 0 }} />;
    }
    if ([".md", ".txt"].includes(ext)) {
        return <FileText size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />;
    }

    return <File size={16} style={{ color: "var(--text-dim)", flexShrink: 0 }} />;
};

export const FileIcon: React.FC<FileIconProps> = ({ file, iconTheme = "material", isOpen = false }) => {
    switch (iconTheme) {
        case "vs-seti":
            return renderSetiIcon(file, isOpen);
        case "minimal":
            return renderMinimalIcon(file, isOpen);
        case "material":
        default:
            return renderMaterialIcon(file, isOpen);
    }
};
