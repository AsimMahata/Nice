type Props = {
    aiResponse: string
}

const AiHelpPanel = (props: Props) => {
    return (
        <div className="ai-help-panel" style={{ whiteSpace: "pre-wrap" }}>
            {props.aiResponse}
        </div>
    )
}

export default AiHelpPanel
