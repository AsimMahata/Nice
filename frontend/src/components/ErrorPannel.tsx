
type Props = {
  error: string,
  setError: (value: string) => void
  running: Boolean
}
const ErrorPannel = (props: Props) => {
  return (
    <div>
      {!props.running && props.error}
      {props.running && "Running Wait..."}
    </div>
  )
}

export default ErrorPannel
