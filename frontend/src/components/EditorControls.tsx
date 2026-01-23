import axios, { AxiosError, AxiosResponse } from "axios"
import '../styles/EditorControls.css'
import React, { useState } from "react"

type Props = {
  code: string
  output: string
  setOutput: React.Dispatch<React.SetStateAction<string>>
  error: string
  setError: React.Dispatch<React.SetStateAction<string>>
  setRunning: React.Dispatch<React.SetStateAction<boolean>>
  setAiResponse: React.Dispatch<React.SetStateAction<string>>
  input: string
  setSavingCode: React.Dispatch<React.SetStateAction<boolean>>
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
// the main controler of all the actions which happens to code name is bad 
// NOTE: there are so much stuff here have to move them to a utils section

const EditorControls = (props: Props) => {

  const [hasError, setHasError] = useState(false)        // whether running or compililation has generated any error it is used to trigger getAIHELP button

  // trigger save code function in NOTE: fileaction.ts

  const saveCode = async () => {
    console.log('code saved')
    console.log(props.code)
    props.setSavingCode(p => !p)
  }
  const getAiHelp = async () => {
    if (!props.error) return;

    const errObj = {
      error: props.error,
      type: "comile time error"
    }

    const url: string = 'http://localhost:3000/api/ai/help'; //WARN: hard coded backend url

    await axios.post(url, errObj).then((res: AxiosResponse) => {

      props.setAiResponse(res.data)

    }).catch((err) => {

      console.error('sometehing error occured with gemini/AI so cant help sad 🥲 \n', err)

    }).finally(() => setHasError(false))
  }

  // NOTE: smamaj lena 🥲
  const runCode = async () => {
    // the things thats need to be sent in backend
    const payload: code = {
      code: props.code,
      input: props.input
    }

    props.setOutput('No Output')                                                  //  before running set output to default
    props.setAiResponse('')                                                       //  ai response to empty

    const url: string = 'http://localhost:3000/api/cpp/run';                      // WARN: hard coded need to be in .env
    props.setRunning(true)                        // WARN: every props is getting used in the format props.VAR needs to be { separated }

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

  // TODO: still havent implemented

  const compileCode = () => {
    const code = props.code
    console.log(code)
  }

  return (
    <div className="EditorControlsContainer">
      <button onClick={runCode}>Run</button>
      <button onClick={compileCode}>Compile</button>
      <button onClick={saveCode}>SaveCode</button>
      <button onClick={getAiHelp}
        className={`ai-btn ${hasError ? "ai-btn-error" : ""}`}
      >Get AI Help</button>
    </div>
  )
}

export default EditorControls
