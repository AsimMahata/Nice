type Props = {
  output: string,
  setOutput: (value: string) => void
  running: Boolean
}

const OutputPannel = (props: Props) => {
  return (
    <div>
      {!props.running && props.output}
      {props.running && "Running Wait..."}
    </div>
  )
}

export default OutputPannel
