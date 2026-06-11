import { useState, useEffect, ReactNode } from "react";
import { AuthContext } from "./AuthContext";
// import { useNavigate } from "react-router-dom";


export interface User {
    _id: string;
    name: string;
    username: string;
    email: string;
    provider: "Local" | "Google" | "Github";
    codeforcesLink?: string;
    leetcodeLink?: string;
    githubLink?: string;
    linkedinLink?: string;
    createdAt?: string;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    // const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = async () => {
        try {
            const url = `${import.meta.env.VITE_API_URL}/user/current-user`;
            const response = await fetch(url, {
                credentials: "include",
            });

            const result = await response.json();
            console.log(result);

            if (response.ok && result.success && result.data) {
                setUser(result.data);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Auth check failed", error);
            setUser(null);

            // if (window.location.pathname.startsWith('/dashboard')) {
            //   navigate('/login');
            // }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, refreshAuth: checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
};
