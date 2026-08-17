import { FolderOpen, Sparkles } from "lucide-react";
import PickDir from "../FileEx/PickDir";
import "./Greeter.css";

const Greeter = () => {
    return (
        <div className="greeter-container">
            <div className="greeter-hero">
                <span className="greeter-badge">
                    <Sparkles size={13} /> Welcome to Nice
                </span>
                <h1 className="greeter-title">
                    <span className="highlight-letter">N</span>ice <span className="highlight-letter">I</span>s <span className="highlight-letter">C</span>ode <span className="highlight-letter">E</span>ditor
                </h1>
                <p className="greeter-subtitle">
                    Select a project directory or open an existing file from the explorer to begin coding.
                </p>
            </div>

            <div className="greeter-grid">
                <div className="greeter-card">
                    <div className="greeter-card-header">
                        <FolderOpen size={18} />
                        <span>Open Project</span>
                    </div>
                    <p className="greeter-card-desc">
                        Select a workspace directory to browse files and compile code.
                    </p>
                    <div style={{ marginTop: "8px" }}>
                        <PickDir text="Select Folder" />
                    </div>
                </div>
            </div>

            <div style={{ width: "100%", maxWidth: "440px", marginTop: "24px" }}>
                <div className="greeter-shortcut-row">
                    <span>Quick Command Search</span>
                    <span className="badge badge-primary">⌘P / Ctrl+P</span>
                </div>
            </div>

            <p className="greeter-footer-note">Made with ❤️ for our beloved juniors</p>
        </div>
    );
};

export default Greeter;
