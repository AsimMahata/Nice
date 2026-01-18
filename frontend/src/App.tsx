import './App.css'
import CodeEditor from './components/CodeEditor'

function App() {
  const handleRun = () => {

  }
  return (
    <div>
      <div>
        Code Editor
      </div>
      <button
        onClick={handleRun}
      >
        Run
      </button>
      <CodeEditor />
    </div>
  )
}

export default App
