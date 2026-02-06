import { useState } from "react"
import Login from "../../pages/Auth/Login"
import { AuthContext } from "../../contexts/AuthContext"

type Props = {}

const UserDetails = ({ }: Props) => {
    const [user, _setUser] = useState<string | null>(AuthContext.name)
    if (!user) return <Login />
    return (
        <div>{user}</div>
    )
}

export default UserDetails

