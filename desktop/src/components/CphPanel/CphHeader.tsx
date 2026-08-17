import React from "react";

interface CphHeaderProps {
    problemName: string;
    timeLimit: number;
    setTimeLimit: (limit: number) => void;
    onSaveLimit: (limit: number) => void;
}

export const CphHeader: React.FC<CphHeaderProps> = ({
    problemName,
    timeLimit,
    setTimeLimit,
    onSaveLimit,
}) => {
    return (
        <div className="cph-panel-header">
            <h3>CPH Judge</h3>
            <span className="prob-name" title={problemName}>{problemName}</span>
            
            <div className="limit-row">
                <label>Limit (ms):</label>
                <input 
                    type="number" 
                    value={timeLimit} 
                    onChange={(e) => {
                        const val = Number(e.target.value);
                        setTimeLimit(val);
                        onSaveLimit(val);
                    }} 
                />
            </div>
        </div>
    );
};
