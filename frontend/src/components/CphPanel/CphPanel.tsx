import { useEffect, useState } from "react";
import { useEditorContext } from "../../contexts/Editor/EditorProvider";
import { Play, Plus, Trash2, Code2, AlertTriangle, Clock } from "lucide-react";
import "./CphPanel.css";

interface TestCase {
    id: number | string;
    input: string;
    expectedOutput: string;
    output?: string;
    status?: 'idle' | 'running' | 'passed' | 'failed' | 'error';
    time?: number;
    errorMsg?: string;
}

const CphPanel = () => {
    const { editorState } = useEditorContext();
    const activeFile = editorState.activeFile;

    const [problemName, setProblemName] = useState("");
    const [timeLimit, setTimeLimit] = useState(2000);
    const [tests, setTests] = useState<TestCase[]>([]);
    
    const [compiling, setCompiling] = useState(false);
    const [running, setRunning] = useState(false);
    const [compilationError, setCompilationError] = useState<string | null>(null);

    // Normalize output strings for comparison (removes trailing spaces and carriage returns)
    const compareOutputs = (out1: string, out2: string): boolean => {
        const normalize = (s: string) => 
            s.trim()
             .replace(/\r\n/g, '\n')
             .split('\n')
             .map(line => line.trimEnd())
             .join('\n')
             .trim();
        return normalize(out1) === normalize(out2);
    };

    // Load problem JSON from .cph folder when active file changes
    useEffect(() => {
        if (!activeFile) return;

        const loadTests = async () => {
            try {
                if (!window.fileSystem) return;

                const parentDir = await window.fileSystem.getParDir(activeFile);
                const activeFileName = activeFile.split(/[/\\]/).pop() || '';
                const cphFolder = await window.fileSystem.join(parentDir, ".cph");
                const cphJsonPath = await window.fileSystem.join(cphFolder, `${activeFileName}.json`);

                try {
                    const content = await window.fileSystem.readFile(cphJsonPath);
                    if (content) {
                        const data = JSON.parse(content);
                        setProblemName(data.name || activeFileName);
                        setTimeLimit(data.timeLimit || 2000);
                        setTests(data.tests || []);
                        setCompilationError(null);
                        return;
                    }
                } catch {
                    // File does not exist, set default empty state
                    const baseName = activeFileName.substring(0, activeFileName.lastIndexOf('.'));
                    setProblemName(baseName);
                    setTimeLimit(2000);
                    setTests([]);
                    setCompilationError(null);
                }
            } catch (err) {
                console.error("Error loading CPH test cases:", err);
            }
        };

        loadTests();
    }, [activeFile]);

    // Save testcases array to `.cph/${activeFileName}.json` file
    const saveTests = async (updatedTests: TestCase[], updatedTimeLimit = timeLimit) => {
        if (!activeFile || !window.fileSystem) return;
        try {
            const parentDir = await window.fileSystem.getParDir(activeFile);
            const activeFileName = activeFile.split(/[/\\]/).pop() || '';
            const cphFolder = await window.fileSystem.join(parentDir, ".cph");

            await window.fileSystem.createFolder(cphFolder);
            const cphJsonPath = await window.fileSystem.join(cphFolder, `${activeFileName}.json`);

            const data = {
                name: problemName || activeFileName.split('.')[0],
                timeLimit: updatedTimeLimit,
                tests: updatedTests.map(t => ({
                    id: t.id,
                    input: t.input,
                    expectedOutput: t.expectedOutput
                }))
            };

            await window.fileSystem.writeFileContent(cphJsonPath, JSON.stringify(data, null, 2));
        } catch (err) {
            console.error("Error saving CPH test cases:", err);
        }
    };

    const handleAddTestcase = () => {
        const newTest: TestCase = {
            id: Date.now(),
            input: "",
            expectedOutput: "",
            status: "idle"
        };
        const updated = [...tests, newTest];
        setTests(updated);
        saveTests(updated);
    };

    const handleUpdateTestcase = (id: number | string, fields: Partial<TestCase>) => {
        const updated = tests.map(t => t.id === id ? { ...t, ...fields } : t);
        setTests(updated);
        if ('input' in fields || 'expectedOutput' in fields) {
            saveTests(updated);
        }
    };

    const handleDeleteTestcase = (id: number | string) => {
        const updated = tests.filter(t => t.id !== id);
        setTests(updated);
        saveTests(updated);
    };

    // Compiles and runs all testcases sequentially
    const runAllTests = async () => {
        if (!activeFile || tests.length === 0 || running || compiling) return;

        setCompiling(true);
        setCompilationError(null);
        setTests(prev => prev.map(t => ({ ...t, status: 'idle', output: undefined, time: undefined, errorMsg: undefined })));

        try {
            const compileRes = await window.cph!.compile(activeFile);
            setCompiling(false);

            if (!compileRes.success) {
                setCompilationError(compileRes.error || "Compilation failed");
                setTests(prev => prev.map(t => ({ ...t, status: 'error', errorMsg: 'Compilation Error' })));
                return;
            }

            setRunning(true);
            const binaryPath = compileRes.binaryPath!;

            for (let i = 0; i < tests.length; i++) {
                const test = tests[i];
                setTests(prev => prev.map(t => t.id === test.id ? { ...t, status: 'running' } : t));

                const res = await window.cph!.runTestcase(binaryPath, test.input, timeLimit);
                const passed = res.exitCode === 0 && !res.timeout && compareOutputs(res.stdout, test.expectedOutput);
                
                let status: TestCase['status'] = 'passed';
                let errorMsg = '';

                if (res.timeout) {
                    status = 'failed';
                    errorMsg = 'Time Limit Exceeded';
                } else if (res.exitCode !== 0) {
                    status = 'error';
                    errorMsg = res.stderr || 'Runtime Error';
                } else if (!passed) {
                    status = 'failed';
                    errorMsg = 'Wrong Answer';
                }

                setTests(prev => prev.map(t => t.id === test.id ? {
                    ...t,
                    status,
                    output: res.stdout,
                    time: res.time,
                    errorMsg
                } : t));
            }
        } catch (err: any) {
            console.error("Error running CPH tests:", err);
            setCompilationError(err.message || "An unexpected error occurred");
        } finally {
            setCompiling(false);
            setRunning(false);
        }
    };

    // Compiles and runs only one single testcase
    const runSingleTest = async (testId: number | string) => {
        if (!activeFile || running || compiling) return;

        setCompiling(true);
        setCompilationError(null);
        setTests(prev => prev.map(t => t.id === testId ? { ...t, status: 'idle', output: undefined, time: undefined, errorMsg: undefined } : t));

        try {
            const compileRes = await window.cph!.compile(activeFile);
            setCompiling(false);

            if (!compileRes.success) {
                setCompilationError(compileRes.error || "Compilation failed");
                setTests(prev => prev.map(t => t.id === testId ? { ...t, status: 'error', errorMsg: 'Compilation Error' } : t));
                return;
            }

            setRunning(true);
            const binaryPath = compileRes.binaryPath!;
            const test = tests.find(t => t.id === testId);
            if (!test) return;

            setTests(prev => prev.map(t => t.id === testId ? { ...t, status: 'running' } : t));

            const res = await window.cph!.runTestcase(binaryPath, test.input, timeLimit);
            const passed = res.exitCode === 0 && !res.timeout && compareOutputs(res.stdout, test.expectedOutput);

            let status: TestCase['status'] = 'passed';
            let errorMsg = '';

            if (res.timeout) {
                status = 'failed';
                errorMsg = 'Time Limit Exceeded';
            } else if (res.exitCode !== 0) {
                status = 'error';
                errorMsg = res.stderr || 'Runtime Error';
            } else if (!passed) {
                status = 'failed';
                errorMsg = 'Wrong Answer';
            }

            setTests(prev => prev.map(t => t.id === testId ? {
                ...t,
                status,
                output: res.stdout,
                time: res.time,
                errorMsg
            } : t));
        } catch (err: any) {
            console.error("Error running CPH testcase:", err);
            setCompilationError(err.message || "An unexpected error occurred");
        } finally {
            setCompiling(false);
            setRunning(false);
        }
    };

    if (!activeFile || !(activeFile.endsWith(".cpp") || activeFile.endsWith(".cc") || activeFile.endsWith(".c"))) {
        return (
            <div className="cph-panel-empty">
                <Code2 size={40} className="empty-icon" />
                <p>Open a valid C/C++ file to initialize CPH Judge.</p>
            </div>
        );
    }

    return (
        <div className="cph-panel-root">
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
                            saveTests(tests, val);
                        }} 
                    />
                </div>
            </div>

            <div className="cph-actions-row">
                <button 
                    className="btn btn-primary" 
                    onClick={runAllTests} 
                    disabled={compiling || running || tests.length === 0}
                >
                    <Play size={14} />
                    {compiling ? "Compiling..." : running ? "Running..." : "Run All"}
                </button>
                
                <button className="btn btn-secondary" onClick={handleAddTestcase}>
                    <Plus size={14} />
                    Add Case
                </button>
            </div>

            {compilationError && (
                <div className="compilation-error-box">
                    <div className="err-title">
                        <AlertTriangle size={14} />
                        <span>Compilation Error</span>
                    </div>
                    <pre>{compilationError}</pre>
                </div>
            )}

            <div className="cph-tests-list">
                {tests.map((test, index) => (
                    <div className={`testcase-card ${test.status || 'idle'}`} key={test.id}>
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
                                    onClick={() => runSingleTest(test.id)}
                                >
                                    <Play size={12} />
                                </button>
                                <button 
                                    className="card-icon-btn delete" 
                                    title="Delete testcase" 
                                    onClick={() => handleDeleteTestcase(test.id)}
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
                                    onChange={(e) => handleUpdateTestcase(test.id, { input: e.target.value })}
                                />
                            </div>

                            <div className="io-group">
                                <label>Expected Output</label>
                                <textarea 
                                    value={test.expectedOutput}
                                    rows={2}
                                    placeholder="Enter expected outputs..."
                                    onChange={(e) => handleUpdateTestcase(test.id, { expectedOutput: e.target.value })}
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
                ))}

                {tests.length === 0 && (
                    <div className="no-cases">
                        <Clock size={24} />
                        <span>No test cases added. Click "Add Case" to begin.</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CphPanel;