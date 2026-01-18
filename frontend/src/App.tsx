import { useState } from 'react'
import './App.css'
import CodeEditor from './components/CodeEditor'
import EditorControls from './components/EditorControls'
import OutputPannel from './components/OutputPannel'
import ErrorPannel from './components/ErrorPannel'

function App() {
  const Placeholder = `#include<bits/stdc++.h>
using namespace std;


int main(){

    cout<<"Hello World!!"<<endl;

    return 0;
}`

  const [code, setCode] = useState(Placeholder)
  const [output, setOutput] = useState('No Output')
  const [error, setError] = useState('')
  const [running, setRunning] = useState(false)
  return (
    <div>
      <div>
        Code Editor
      </div>
      <EditorControls
        code={code}
        output={output}
        setOutput={setOutput}
        error={error}
        setError={setError}
        setRunning={setRunning}
      />
      <CodeEditor
        code={code}
        setCode={setCode} />
      <div className='output-error'>

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
      </div>
    </div>
  )
}

export default App
