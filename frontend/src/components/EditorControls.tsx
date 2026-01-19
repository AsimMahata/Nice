import axios, { AxiosError, AxiosResponse } from "axios"
import '../styles/EditorControls.css'
import { useState } from "react"

type Props = {
  code: string
  output: string
  setOutput: React.Dispatch<React.SetStateAction<string>>
  error: string
  setError: React.Dispatch<React.SetStateAction<string>>
  setRunning: React.Dispatch<React.SetStateAction<boolean>>
  setAiResponse: React.Dispatch<React.SetStateAction<string>>
  input: string
}
type code = {
  code: string
  input: string
}

type status = {
  success: boolean,
  output: string
  error: string
  runtimeError: string
  compilationError: string
}

const EditorControls = (props: Props) => {

  const [hasError, setHasError] = useState(false)

  const getAiHelp = async () => {
    if (!props.error) return;
    const errObj = {
      error: props.error,
      type: "comile time error"
    }
    const url: string = 'http://localhost:3000/api/ai/help';
    await axios.post(url, errObj).then((res: AxiosResponse) => {
      props.setAiResponse(res.data)
    }).catch((err) => {
      console.error('sometehing error occured with gemini/AI so cant help sad 🥲 \n', err)
    }).finally(() => setHasError(false))
  }


  const runCode = async () => {
    const payload: code = {
      code: props.code,
      input: props.input
    }
    props.setOutput('No Output')
    const url: string = 'http://localhost:3000/api/cpp/run';
    props.setRunning(true)
    await axios.post<status>(url, payload).then((res: AxiosResponse) => {
      props.setError(res?.data?.error)
      props.setOutput(res?.data?.output);
      console.log(res);
    }).catch((err: AxiosError<status>) => {
      const error = String(err.response?.data?.error);
      props.setOutput('Something Went Wrong ...')
      props.setError(error);
      setHasError(true)
      setTimeout(() => setHasError(false), 3000)
      console.error(err);
    }).finally(() => {
      props.setRunning(false)
    });
  }

  const compileCode = () => {
    const code = props.code
    console.log(code)
  }

  return (
    <div className="EditorControlsContainer">
      <button onClick={runCode}>Run</button>
      <button onClick={compileCode}>Compile</button>
      <button onClick={getAiHelp}
        className={`ai-btn ${hasError ? "ai-btn-error" : ""}`}
      >Get AI Help</button>
    </div>
  )
}

export default EditorControls
