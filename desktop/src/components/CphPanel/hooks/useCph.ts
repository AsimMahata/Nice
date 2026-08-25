import { useEffect, useRef, useState, useCallback } from "react";
import { useEditorContext } from "../../../contexts/Editor/EditorProvider";
import { TestCase } from "../CphTestCaseCard";
import { cphStore, CphFileExecutionState } from "./cph.store";

export function useCph() {
    const { editorState } = useEditorContext();
    const activeFile = editorState.activeFile;

    const [problemName, setProblemName] = useState("");
    const [timeLimit, setTimeLimit] = useState(2000);
    const [tests, setTests] = useState<TestCase[]>([]);
    const [compiling, setCompiling] = useState(false);
    const [running, setRunning] = useState(false);
    const [compilationError, setCompilationError] = useState<string | null>(null);

    const activeFileRef = useRef(activeFile);
    activeFileRef.current = activeFile;

    const timeLimitRef = useRef(timeLimit);
    timeLimitRef.current = timeLimit;

    const problemNameRef = useRef(problemName);
    problemNameRef.current = problemName;

    const compareOutputs = useCallback((out1: string, out2: string): boolean => {
        const normalize = (s: string) =>
            s.trim()
             .replace(/\r\n/g, '\n')
             .split('\n')
             .map((line) => line.trimEnd())
             .join('\n')
             .trim();
        return normalize(out1) === normalize(out2);
    }, []);

    // Sync state from store when activeFile changes or store notifies
    const syncFromStore = useCallback((file: string) => {
        const stored = cphStore.getState(file);
        if (stored) {
            setCompiling(stored.compiling);
            setRunning(stored.running);
            setTests(stored.tests);
            setCompilationError(stored.compilationError);
            if (stored.problemName) setProblemName(stored.problemName);
            if (stored.timeLimit) setTimeLimit(stored.timeLimit);
            return true;
        }
        return false;
    }, []);

    // Subscribe to store updates
    useEffect(() => {
        const unsubscribe = cphStore.subscribe((filePath) => {
            if (filePath === activeFileRef.current) {
                syncFromStore(filePath);
            }
        });
        return unsubscribe;
    }, [syncFromStore]);

    // Load or switch tests when activeFile changes
    useEffect(() => {
        if (!activeFile) return;

        // If file already exists in store (e.g. was running or previously loaded), restore immediately
        const hasStored = syncFromStore(activeFile);
        if (hasStored) return;

        const loadTests = async () => {
            try {
                if (!window.fileSystem) return;

                const parentDir = await window.fileSystem.getParDir(activeFile);
                const activeFileName = activeFile.split(/[/\\]/).pop() || '';
                const cphFolder = await window.fileSystem.join(parentDir, ".cph");
                const cphJsonPath = await window.fileSystem.join(cphFolder, `${activeFileName}.json`);

                let loadedName = activeFileName.substring(0, activeFileName.lastIndexOf('.')) || activeFileName;
                let loadedLimit = 2000;
                let loadedTests: TestCase[] = [];

                try {
                    const content = await window.fileSystem.readFile(cphJsonPath);
                    if (content) {
                        const data = JSON.parse(content);
                        loadedName = data.name || loadedName;
                        loadedLimit = data.timeLimit || 2000;
                        loadedTests = data.tests || [];
                    }
                } catch {
                    // No existing .cph json, use defaults
                }

                if (activeFileRef.current === activeFile) {
                    setProblemName(loadedName);
                    setTimeLimit(loadedLimit);
                    setTests(loadedTests);
                    setCompiling(false);
                    setRunning(false);
                    setCompilationError(null);

                    cphStore.setState(activeFile, {
                        problemName: loadedName,
                        timeLimit: loadedLimit,
                        tests: loadedTests,
                        compiling: false,
                        running: false,
                        compilationError: null,
                    });
                }
            } catch (err) {
                console.error("Error loading CPH test cases:", err);
            }
        };

        loadTests();
    }, [activeFile, syncFromStore]);

    const saveTests = async (updatedTests: TestCase[], updatedTimeLimit = timeLimitRef.current) => {
        if (!activeFile || !window.fileSystem) return;
        try {
            const currentName = problemNameRef.current;
            const parentDir = await window.fileSystem.getParDir(activeFile);
            const activeFileName = activeFile.split(/[/\\]/).pop() || '';
            const cphFolder = await window.fileSystem.join(parentDir, ".cph");

            await window.fileSystem.createDirectory(cphFolder);
            const cphJsonPath = await window.fileSystem.join(cphFolder, `${activeFileName}.json`);

            const data = {
                name: currentName || activeFileName.split('.')[0],
                timeLimit: updatedTimeLimit,
                tests: updatedTests.map((t) => ({
                    id: t.id,
                    input: t.input,
                    expectedOutput: t.expectedOutput,
                })),
            };

            await window.fileSystem.writeFileContent(cphJsonPath, JSON.stringify(data, null, 2));

            cphStore.setState(activeFile, {
                tests: updatedTests,
                timeLimit: updatedTimeLimit,
                problemName: currentName,
            });
        } catch (err) {
            console.error("Error saving CPH test cases:", err);
        }
    };

    const handleAddTestcase = () => {
        if (!activeFile) return;
        const newTest: TestCase = {
            id: Date.now(),
            input: "",
            expectedOutput: "",
            status: "idle",
        };
        const currentTests = cphStore.getState(activeFile)?.tests || tests;
        const updated = [...currentTests, newTest];
        setTests(updated);
        cphStore.setState(activeFile, { tests: updated });
        saveTests(updated);
    };

    const handleUpdateTestcase = (id: number | string, fields: Partial<TestCase>) => {
        if (!activeFile) return;
        const currentTests = cphStore.getState(activeFile)?.tests || tests;
        const updated = currentTests.map((t) => (t.id === id ? { ...t, ...fields } : t));
        setTests(updated);
        cphStore.setState(activeFile, { tests: updated });
        if ('input' in fields || 'expectedOutput' in fields) {
            saveTests(updated);
        }
    };

    const handleDeleteTestcase = (id: number | string) => {
        if (!activeFile) return;
        const currentTests = cphStore.getState(activeFile)?.tests || tests;
        const updated = currentTests.filter((t) => t.id !== id);
        setTests(updated);
        cphStore.setState(activeFile, { tests: updated });
        saveTests(updated);
    };

    const getLanguageFromPath = (filePath: string): string => {
        const ext = filePath.slice(filePath.lastIndexOf('.')).toLowerCase();
        const extToLang: Record<string, string> = {
            '.cpp': 'cpp', '.cc': 'cpp', '.cxx': 'cpp',
            '.c': 'c', '.py': 'python', '.java': 'java',
        };
        return extToLang[ext] || 'cpp';
    };

    const runAllTests = async () => {
        if (!activeFile) return;

        // Prevent duplicate runs if this file or any execution is already active
        if (cphStore.isFileRunning(activeFile) || compiling || running) {
            console.warn(`[CPH Frontend] Execution already in progress for ${activeFile}.`);
            return;
        }

        const targetFile = activeFile;
        const storedState = cphStore.getState(targetFile);
        const currentTests = storedState?.tests || tests;
        if (currentTests.length === 0) return;

        const currentLimit = storedState?.timeLimit || timeLimitRef.current;
        const resetTests: TestCase[] = currentTests.map((t) => ({
            ...t,
            status: 'idle',
            output: undefined,
            time: undefined,
            errorMsg: undefined,
        }));

        console.log("[CPH Frontend] Starting runAllTests for:", targetFile);

        cphStore.setState(targetFile, {
            compiling: true,
            running: false,
            compilationError: null,
            tests: resetTests,
        });

        try {
            const lang = getLanguageFromPath(targetFile);
            const compileRes = await window.cph!.compile(targetFile, lang);
            console.log("[CPH Frontend] Compile response:", compileRes);

            if (!compileRes.success) {
                console.error("[CPH Frontend] Compilation failed:", compileRes.error);
                cphStore.setState(targetFile, {
                    compiling: false,
                    running: false,
                    compilationError: compileRes.error || "Compilation failed",
                    tests: (cphStore.getState(targetFile)?.tests || resetTests).map((t) => ({
                        ...t,
                        status: 'error',
                        errorMsg: 'Compilation Error',
                    })),
                });
                return;
            }

            cphStore.setState(targetFile, {
                compiling: false,
                running: true,
            });

            const binaryPath = compileRes.binaryPath || '';
            const codeToPass = compileRes.code;
            const testsToRun = cphStore.getState(targetFile)?.tests || resetTests;

            for (let i = 0; i < testsToRun.length; i++) {
                const test = testsToRun[i];
                console.log(`[CPH Frontend] Running case #${i + 1} (id: ${test.id}) for ${targetFile}`);

                // Mark current test case as running
                cphStore.setState(targetFile, {
                    tests: (cphStore.getState(targetFile)?.tests || testsToRun).map((t) =>
                        t.id === test.id ? { ...t, status: 'running' } : t
                    ),
                });

                const res = await window.cph!.runTestcase(
                    binaryPath,
                    test.input,
                    currentLimit,
                    compileRes.language || lang,
                    codeToPass
                );
                console.log(`[CPH Frontend] Case #${i + 1} result:`, res);

                const passed = res.exitCode === 0 && !res.timeout && compareOutputs(res.stdout, test.expectedOutput);
                let status: TestCase['status'] = 'passed';
                let errorMsg = '';

                if (res.status === 'Compilation Error') {
                    status = 'error';
                    errorMsg = res.error || res.stderr || 'Compilation Error';
                    cphStore.setState(targetFile, { compilationError: errorMsg });
                } else if (res.timeout) {
                    status = 'failed';
                    errorMsg = 'Time Limit Exceeded';
                } else if (res.exitCode !== 0) {
                    status = 'error';
                    errorMsg = res.stderr || 'Runtime Error';
                } else if (!passed) {
                    status = 'failed';
                    errorMsg = 'Wrong Answer';
                }

                // Update test case outcome in store
                cphStore.setState(targetFile, {
                    tests: (cphStore.getState(targetFile)?.tests || testsToRun).map((t) =>
                        t.id === test.id
                            ? { ...t, status, output: res.stdout, time: res.time, errorMsg }
                            : t
                    ),
                });
            }
        } catch (err: any) {
            console.error("[CPH Frontend] Error running CPH tests:", err);
            cphStore.setState(targetFile, {
                compilationError: err.message || "An unexpected error occurred",
            });
        } finally {
            cphStore.setState(targetFile, {
                compiling: false,
                running: false,
            });
        }
    };

    const runSingleTest = async (testId: number | string) => {
        if (!activeFile) return;

        if (cphStore.isFileRunning(activeFile) || compiling || running) {
            console.warn(`[CPH Frontend] Execution already in progress for ${activeFile}.`);
            return;
        }

        const targetFile = activeFile;
        const storedState = cphStore.getState(targetFile);
        const currentTests = storedState?.tests || tests;
        const test = currentTests.find((t) => t.id === testId);
        if (!test) return;

        const currentLimit = storedState?.timeLimit || timeLimitRef.current;

        console.log(`[CPH Frontend] Running single test (id: ${testId}) for:`, targetFile);

        cphStore.setState(targetFile, {
            compiling: true,
            running: false,
            compilationError: null,
            tests: currentTests.map((t) =>
                t.id === testId
                    ? { ...t, status: 'idle', output: undefined, time: undefined, errorMsg: undefined }
                    : t
            ),
        });

        try {
            const lang = getLanguageFromPath(targetFile);
            const compileRes = await window.cph!.compile(targetFile, lang);

            if (!compileRes.success) {
                console.error("[CPH Frontend] Compilation failed:", compileRes.error);
                cphStore.setState(targetFile, {
                    compiling: false,
                    running: false,
                    compilationError: compileRes.error || "Compilation failed",
                    tests: (cphStore.getState(targetFile)?.tests || currentTests).map((t) =>
                        t.id === testId ? { ...t, status: 'error', errorMsg: 'Compilation Error' } : t
                    ),
                });
                return;
            }

            cphStore.setState(targetFile, {
                compiling: false,
                running: true,
                tests: (cphStore.getState(targetFile)?.tests || currentTests).map((t) =>
                    t.id === testId ? { ...t, status: 'running' } : t
                ),
            });

            const binaryPath = compileRes.binaryPath || '';
            const codeToPass = compileRes.code;

            const res = await window.cph!.runTestcase(
                binaryPath,
                test.input,
                currentLimit,
                compileRes.language || lang,
                codeToPass
            );

            const passed = res.exitCode === 0 && !res.timeout && compareOutputs(res.stdout, test.expectedOutput);
            let status: TestCase['status'] = 'passed';
            let errorMsg = '';

            if (res.status === 'Compilation Error') {
                status = 'error';
                errorMsg = res.error || res.stderr || 'Compilation Error';
                cphStore.setState(targetFile, { compilationError: errorMsg });
            } else if (res.timeout) {
                status = 'failed';
                errorMsg = 'Time Limit Exceeded';
            } else if (res.exitCode !== 0) {
                status = 'error';
                errorMsg = res.stderr || 'Runtime Error';
            } else if (!passed) {
                status = 'failed';
                errorMsg = 'Wrong Answer';
            }

            cphStore.setState(targetFile, {
                tests: (cphStore.getState(targetFile)?.tests || currentTests).map((t) =>
                    t.id === testId
                        ? { ...t, status, output: res.stdout, time: res.time, errorMsg }
                        : t
                ),
            });
        } catch (err: any) {
            console.error("[CPH Frontend] Error running CPH single test:", err);
            cphStore.setState(targetFile, {
                compilationError: err.message || "An unexpected error occurred",
            });
        } finally {
            cphStore.setState(targetFile, {
                compiling: false,
                running: false,
            });
        }
    };

    return {
        problemName,
        timeLimit,
        setTimeLimit: (limit: number) => {
            setTimeLimit(limit);
            if (activeFile) cphStore.setState(activeFile, { timeLimit: limit });
        },
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
