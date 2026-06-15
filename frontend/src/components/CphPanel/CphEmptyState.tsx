import React from "react";
import { Code2 } from "lucide-react";

export const CphEmptyState: React.FC = () => {
    return (
        <div className="cph-panel-empty">
            <Code2 size={40} className="empty-icon" />
            <p>Open a valid C/C++ file to initialize CPH Judge.</p>
        </div>
    );
};
