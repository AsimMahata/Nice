
type Props = {
  error: string,
  setError: (value: string) => void
  running: boolean
}
const ErrorPannel = (props: Props) => {
  return (
    <div style={{ whiteSpace: "pre-wrap" }}>
      {!props.running && props.error}
      {props.running && "Running Wait..."}
    </div>
  )
}

export default ErrorPannel
