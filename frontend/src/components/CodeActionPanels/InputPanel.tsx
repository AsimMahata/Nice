type Props = {
  input: string
  setInput: React.Dispatch<React.SetStateAction<string>>
}

const InputPanel = (props: Props) => {
  return (
    <textarea
      className="input-container"
      placeholder="input here..."
      value={props.input}
      onChange={(e) => props.setInput(e.target.value)}
    />
  )
}

export default InputPanel
