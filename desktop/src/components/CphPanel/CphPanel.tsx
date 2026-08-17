import { useEditorContext } from "../../contexts/Editor/EditorProvider";
import { Play, Plus, Clock } from "lucide-react";
import { CphEmptyState } from "./CphEmptyState";
import { CphHeader } from "./CphHeader";
import { CphTestCaseCard } from "./CphTestCaseCard";
import { CphCompilationError } from "./CphCompilationError";
import { useCph } from "./hooks/useCph";
import "./CphPanel.css";

const CphPanel = () => {
    const { editorState } = useEditorContext();
    const activeFile = editorState.activeFile;

    const {
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
    } = useCph();

    if (!activeFile || !(activeFile.endsWith(".cpp") || activeFile.endsWith(".cc") || activeFile.endsWith(".c"))) {
        return <CphEmptyState />;
    }


    return (
        <div className="cph-panel-root">
            <CphHeader 
                problemName={problemName}
                timeLimit={timeLimit}
                setTimeLimit={setTimeLimit}
                onSaveLimit={(limit) => saveTests(tests, limit)}
            />

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

            {compilationError && <CphCompilationError error={compilationError} />}

            <div className="cph-tests-list">
                {tests.map((test, index) => (
                    <CphTestCaseCard 
                        key={test.id}
                        test={test}
                        index={index}
                        compareOutputs={compareOutputs}
                        onUpdate={handleUpdateTestcase}
                        onDelete={handleDeleteTestcase}
                        onRun={runSingleTest}
                    />
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
