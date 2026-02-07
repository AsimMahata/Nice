import "./Greeter.css"
type Props = {}


const Greeter = (_props: Props) => {
    return (
        <div className="Greeter-main-component">
            <div className="Greeter-Header">
                Welcome to Nice <br />
                Have a Nice Coding Session 😀
            </div>
            <div>
                Before Opening Any Folder People will see this
            </div>
        </div >
    )
}

export default Greeter
