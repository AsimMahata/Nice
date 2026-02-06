import { useState, useMemo, useEffect } from "react";
import CodeEditor from "../components/CodeEditor/CodeEditor";
import ControlPanel from "../components/CodeActions/ControlPanel";
import OutputPannel from "../components/CodeActions/OutputPanel";
import ErrorPannel from "../components/CodeActions/ErrorPanel";
import InputPanel from "../components/CodeActions/InputPanel";
import AiHelpPanel from "../components/CodeActions/AiHelpPanel";
import FileEx from "../components/FileEx/FileEx";
import { FileEntry } from "../components/FileEx/FileAcations";
import { getPlaceholder } from "../utils/getPlaceholder";
import Greeter from "../components/Greeter/Greeter";


function Home() {
    const [lang, setLang] = useState<string>('java')                   // selected Compiler
    const [codeFile, setCodeFile] = useState<FileEntry | null>(null)   // the file that is opned
    const [output, setOutput] = useState('No Output')                  // the output panel
    const [error, setError] = useState('')                             // the error panel
    const [running, setRunning] = useState(false)                      // whether the code is currently running
    const [aiResponse, setAiResponse] = useState('')                   // the aiResponse content
    const [input, setInput] = useState('')                             // input panel content
    const [savingCode, setSavingCode] = useState<boolean>(false);      // its a toogle that triggers save code function
    const placeholder = useMemo(() => {
        return getPlaceholder(lang);
    }, [lang]);
    const [code, setCode] = useState<string>(placeholder);           // the main code inside editor-area
    const [showFileEX, setShowFileEx] = useState<boolean>(false)      // show the file-explorer or not by default no
    const [mainDir, setMainDir] = useState<string | null>(null)        // main project folder by user
    useEffect(() => {
        if (code !== placeholder) {
            setCode(placeholder);
        }
    }, [lang]);

    const [asim, _setAsim] = useState(true)
    useEffect(() => {
        if (asim) {
            setMainDir("/home/asim/dev/testing")
        }
    }, [])
    return (
        <div className="app-root">
            {/* This is the Top Pannel with all the buttons such as Run, Compile , Ai and mainly control all the things for now */}
            <ControlPanel
                code={code}
                output={output}
                setOutput={setOutput}
                error={error}
                setError={setError}
                setRunning={setRunning}
                setAiResponse={setAiResponse}
                input={input}
                setSavingCode={setSavingCode}
                lang={lang}
                setLang={setLang}
                showFileEx={showFileEX}
                setShowFileEx={setShowFileEx}
            />

            {/*rest of the things such as file-explorer code-area input output error aiResponse etc..*/}
            <div className="workspace" >
                {/* File Explorer */}
                {
                    showFileEX &&
                    <aside className={`file-explorer ${showFileEX ? "open" : "closed"}`}>
                        <FileEx
                            codeFile={codeFile}
                            setCodeFile={setCodeFile}
                            code={code}
                            setCode={setCode}
                            savingCode={savingCode}
                            setSavingCode={setSavingCode}
                            mainDir={mainDir}
                            setMainDir={setMainDir}
                        />
                    </aside>
                }

                {
                    !mainDir && <Greeter />
                }

                {/* Main Editor Area */}
                {
                    mainDir &&

                    <main className="editor-area">
                        <CodeEditor key={lang} code={code} setCode={setCode} lang={lang} />
                        <div className="panels" style={{ display: 'none' }}>
                            <InputPanel input={input} setInput={setInput} />

                            <OutputPannel
                                output={output}
                                setOutput={setOutput}
                                running={running}
                            />

                            <ErrorPannel
                                error={error}
                                setError={setError}
                                running={running}
                            />

                            <AiHelpPanel aiResponse={aiResponse} />
                        </div>
                    </main>
                }
            </div>
        </div>
    )
}

export default Home;
