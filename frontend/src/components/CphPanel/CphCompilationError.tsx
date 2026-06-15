import React from "react";
import { AlertTriangle } from "lucide-react";

interface CphCompilationErrorProps {
    error: string;
}

export const CphCompilationError: React.FC<CphCompilationErrorProps> = ({ error }) => {
    return (
        <div className="compilation-error-box">
            <div className="err-title">
                <AlertTriangle size={14} />
                <span>Compilation Error</span>
            </div>
            <pre>{error}</pre>
        </div>
    );
};
