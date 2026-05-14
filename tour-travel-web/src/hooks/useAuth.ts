import { useContext } from "react";
import AuthContext from "../store/AuthContext";
import { IAuthContext } from "../types/auth";

export function useAuth(): IAuthContext {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth phải được dùng bên trong AuthProvider");
    }

    return context;
}