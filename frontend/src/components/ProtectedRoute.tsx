import {PropsWithChildren} from "react";
import {useAuth} from "../hooks/useAuth.tsx";
import {Navigate} from "react-router-dom";

function ProtectedRoute({children}: PropsWithChildren) {
    const {user} = useAuth();

    if (!user) return <Navigate to={'/login'}/>;

    return children;
}

export {ProtectedRoute}