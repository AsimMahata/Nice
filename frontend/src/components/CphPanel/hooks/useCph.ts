import { useEffect, useState } from "react";
import { useEditorContext } from "../../../contexts/Editor/EditorProvider";
import { TestCase } from "../CphTestCaseCard";

export function useCph() {
    const { editorState } = useEditorContext();
    const activeFile = editorState.activeFile;

    const [problemName, setProblemName] = useState("");
    const [timeLimit, setTimeLimit] = useState(2000);
    const [tests, setTests] = useState<TestCase[]>([]);
    
    const [compiling, setCompiling] = useState(false);
    const [running, setRunning] = useState(false);
    const [compilationError, setCompilationError] = useState<string | null>(null);

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

    const runAllTests = async () => {
        if (!activeFile || tests.length === 0 || running || compiling) return;

        console.log("[CPH Frontend] Running all tests for:", activeFile);
        setCompiling(true);
        setCompilationError(null);
        setTests(prev => prev.map(t => ({ ...t, status: 'idle', output: undefined, time: undefined, errorMsg: undefined })));

        try {
            console.log("[CPH Frontend] Triggering compile...");
            const compileRes = await window.cph!.compile(activeFile);
            console.log("[CPH Frontend] Compile response received:", compileRes);
            setCompiling(false);

            if (!compileRes.success) {
                console.error("[CPH Frontend] Compilation failed:", compileRes.error);
                setCompilationError(compileRes.error || "Compilation failed");
                setTests(prev => prev.map(t => ({ ...t, status: 'error', errorMsg: 'Compilation Error' })));
                return;
            }

            setRunning(true);
            const binaryPath = compileRes.binaryPath!;

            for (let i = 0; i < tests.length; i++) {
                const test = tests[i];
                console.log(`[CPH Frontend] Running case #${i + 1} (id: ${test.id})`);
                setTests(prev => prev.map(t => t.id === test.id ? { ...t, status: 'running' } : t));

                const res = await window.cph!.runTestcase(binaryPath, test.input, timeLimit);
                console.log(`[CPH Frontend] Case #${i + 1} output:`, res);
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
            console.error("[CPH Frontend] Error running CPH tests:", err);
            setCompilationError(err.message || "An unexpected error occurred");
        } finally {
            setCompiling(false);
            setRunning(false);
        }
    };

    const runSingleTest = async (testId: number | string) => {
        if (!activeFile || running || compiling) return;

        console.log(`[CPH Frontend] Running single test (id: ${testId}) for:`, activeFile);
        setCompiling(true);
        setCompilationError(null);
        setTests(prev => prev.map(t => t.id === testId ? { ...t, status: 'idle', output: undefined, time: undefined, errorMsg: undefined } : t));

        try {
            console.log("[CPH Frontend] Triggering compile...");
            const compileRes = await window.cph!.compile(activeFile);
            console.log("[CPH Frontend] Compile response received:", compileRes);
            setCompiling(false);

            if (!compileRes.success) {
                console.error("[CPH Frontend] Compilation failed:", compileRes.error);
                setCompilationError(compileRes.error || "Compilation failed");
                setTests(prev => prev.map(t => t.id === testId ? { ...t, status: 'error', errorMsg: 'Compilation Error' } : t));
                return;
            }

            setRunning(true);
            const binaryPath = compileRes.binaryPath!;
            const test = tests.find(t => t.id === testId);
            if (!test) return;

            console.log(`[CPH Frontend] Running case with input:`, test.input);
            setTests(prev => prev.map(t => t.id === testId ? { ...t, status: 'running' } : t));

            const res = await window.cph!.runTestcase(binaryPath, test.input, timeLimit);
            console.log(`[CPH Frontend] Test case output:`, res);
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
            console.error("[CPH Frontend] Error running CPH testcase:", err);
            setCompilationError(err.message || "An unexpected error occurred");
        } finally {
            setCompiling(false);
            setRunning(false);
        }
    };

    return {
        problemName,
        timeLimit,
        setTimeLimit,
        tests,
        compiling,
        running,
        compilationError,
        compareOutputs,
        saveTests,
        handleAddTestcase,
        handleUpdateTestcase,
        handleDeleteTestcase,
        runAllTests,
        runSingleTest,
    };
}
