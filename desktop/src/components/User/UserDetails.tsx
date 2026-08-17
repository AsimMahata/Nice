import { useState } from "react"
import Login from "../../pages/Auth/Login"
import { AuthContext } from "../../contexts/Auth/AuthContext"


const UserDetails = () => {
    const [user, _setUser] = useState<string | null>(AuthContext.name)
    if (!user) return <Login />
    return (
        <div>{user}</div>
    )
}

export default UserDetails

