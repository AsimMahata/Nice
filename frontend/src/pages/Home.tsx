import React from "react";  
import { useState, useMemo, useEffect } from 'react'
import CodeEditor from '../components/CodeEditor'
import EditorControls from '../components/EditorControls'
import OutputPannel from '../components/OutputPanel'
import ErrorPannel from '../components/ErrorPanel'
import InputPanel from '../components/InputPanel'
import AiHelpPanel from '../components/AiHelpPanel'
import FileEx from '../components/FileEx/FileEx'
import { FileEntry } from '../components/FileEx/FileAcations'
import { getPlaceholder } from '../utils/getPlaceholder'



function Home() {
  const [lang, _setLang] = useState<string>('java')                   // selected Compiler
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

  useEffect(() => {
    if (code !== placeholder) {
      setCode(placeholder);
    }
  }, [lang]);



  return (
    <div className="app-root">
      {/* This is the Top Pannel with all the buttons such as Run, Compile , Ai and mainly control all the things for now */}
      <EditorControls
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
        _setLang={_setLang}
      />

      {/*rest of the things such as file-explorer code-area input output error aiResponse etc..*/}
      <div className="workspace">
        {/* File Explorer */}
        <aside className="file-explorer">
          <FileEx
            codeFile={codeFile}
            setCodeFile={setCodeFile}
            code={code}
            setCode={setCode}
            savingCode={savingCode}
            setSavingCode={setSavingCode}
          />
        </aside>

        {/* Main Editor Area */}
        <main className="editor-area">
          <CodeEditor code={code} setCode={setCode} lang={lang} />

          <div className="panels">
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
      </div>
    </div>
  )
}

export default Home;