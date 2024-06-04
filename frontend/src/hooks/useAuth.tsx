import {createContext, PropsWithChildren, useContext, useMemo} from "react";
import {useNavigate} from "react-router-dom";

type TAuthContext = {
    login: () => Promise<void>,
    logout: () => Promise<void>,
    user?: unknown
}

const AuthContext = createContext<TAuthContext>({} as TAuthContext);

function AuthProvider({children}: PropsWithChildren) {
    // TODO: handle user
    const navigate = useNavigate();

    const value = useMemo(() => {
        const login = async () => {
            navigate('/');
        }
    
        const logout = async () => {
            navigate('/login', {replace: true});
        }
        return {login, logout}
}, [navigate])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function useAuth() {
    return useContext(AuthContext)
}

// eslint-disable-next-line react-refresh/only-export-components
export {useAuth, AuthProvider}