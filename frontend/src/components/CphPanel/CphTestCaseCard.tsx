import React from "react";
import { Play, Trash2 } from "lucide-react";

export interface TestCase {
    id: number | string;
    input: string;
    expectedOutput: string;
    output?: string;
    status?: 'idle' | 'running' | 'passed' | 'failed' | 'error';
    time?: number;
    errorMsg?: string;
}

interface CphTestCaseCardProps {
    test: TestCase;
    index: number;
    compareOutputs: (out1: string, out2: string) => boolean;
    onUpdate: (id: number | string, fields: Partial<TestCase>) => void;
    onDelete: (id: number | string) => void;
    onRun: (id: number | string) => void;
}

export const CphTestCaseCard: React.FC<CphTestCaseCardProps> = ({
    test,
    index,
    compareOutputs,
    onUpdate,
    onDelete,
    onRun,
}) => {
    return (
        <div className={`testcase-card ${test.status || 'idle'}`}>
            <div className="card-header">
                <span className="test-num">Test Case #{index + 1}</span>
                
                <div className="badge-and-actions">
                    {test.status === 'running' && <span className="status-badge running">Running</span>}
                    {test.status === 'passed' && (
                        <span className="status-badge passed">
                            Passed ({test.time || 0} ms)
                        </span>
                    )}
                    {test.status === 'failed' && (
                        <span className="status-badge failed">
                            {test.errorMsg || 'Failed'} ({test.time || 0} ms)
                        </span>
                    )}
                    {test.status === 'error' && (
                        <span className="status-badge error">
                            Error
                        </span>
                    )}

                    <button 
                        className="card-icon-btn" 
                        title="Run this testcase" 
                        onClick={() => onRun(test.id)}
                    >
                        <Play size={12} />
                    </button>
                    <button 
                        className="card-icon-btn delete" 
                        title="Delete testcase" 
                        onClick={() => onDelete(test.id)}
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>

            <div className="card-body">
                <div className="io-group">
                    <label>Input</label>
                    <textarea 
                        value={test.input}
                        rows={2}
                        placeholder="Enter test inputs..."
                        onChange={(e) => onUpdate(test.id, { input: e.target.value })}
                    />
                </div>

                <div className="io-group">
                    <label>Expected Output</label>
                    <textarea 
                        value={test.expectedOutput}
                        rows={2}
                        placeholder="Enter expected outputs..."
                        onChange={(e) => onUpdate(test.id, { expectedOutput: e.target.value })}
                    />
                </div>

                {test.output !== undefined && (
                    <div className="io-group received">
                        <label>Received Output</label>
                        <textarea 
                            readOnly 
                            rows={2}
                            value={test.output} 
                            className={compareOutputs(test.output, test.expectedOutput) ? 'out-match' : 'out-mismatch'}
                        />
                        {test.errorMsg && test.status === 'error' && (
                            <div className="stderr-info">
                                <span>Stderr:</span>
                                <pre>{test.errorMsg}</pre>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
