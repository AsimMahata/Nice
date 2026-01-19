type Props = {
  aiResponse: string
}

const AiHelpPanel = (props: Props) => {
  return (
    <div style={{ whiteSpace: "pre-wrap" }}>
      {props.aiResponse}
    </div>
  )
}

export default AiHelpPanel
