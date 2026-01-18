import axios, { AxiosError, AxiosResponse } from "axios"
import '../styles/EditorControls.css'

type Props = {
  code: string,
  output: string,
  setOutput: (value: string) => void
  error: string,
  setError: (value: string) => void
  setRunning: (value: boolean) => void
}
type code = {
  code: string
}

const EditorControls = (props: Props) => {


  const aiSuggest = async (error: string) => {
    const errObj = {
      error: error,
      type: "comile time error"
    }
    const url: string = 'http://localhost:3000/api/ai/help';
    await axios.post(url, errObj).then((res: AxiosResponse) => {
      props.setError(res.data)
    }).catch((err) => {
      console.error('sometehing error occured with gemini so cant help sad 🥲 \n', err)
    })
  }


  const runCode = async () => {
    const code: code = {
      code: props.code
    }
    props.setOutput('No Output')
    const url: string = 'http://localhost:3000/api/cpp/run';
    props.setRunning(true)
    await axios.post(url, code).then((res: AxiosResponse) => {
      props.setError(res.data.error)
      props.setOutput(res.data.output);
      console.log(res);
    }).catch((err: AxiosError) => {
      const error = String(err.response?.data);
      props.setOutput('Something Went Wrong ...')
      props.setError(error);

      aiSuggest(error)

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
      <button>Placeholder</button>
    </div>
  )
}

export default EditorControls
