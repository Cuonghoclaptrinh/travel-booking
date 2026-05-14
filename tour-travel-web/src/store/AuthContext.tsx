// import {
//     createContext,
//     useCallback,
//     useEffect,
//     useMemo,
//     useState,
//     ReactNode,
// } from "react";
// import authService from "../services/authService";
// import { normalizeUser } from "../utils/auth";
// import { IAuthContext, IUser, ILoginPayload } from "../types/auth";

// const AuthContext = createContext<IAuthContext | null>(null);

// const getStoredUser = (): IUser | null => {
//     try {
//         const raw = localStorage.getItem("currentUser");
//         return raw ? normalizeUser(JSON.parse(raw)) : null;
//     } catch {
//         return null;
//     }
// };

// interface AuthProviderProps {
//     children: ReactNode;
// }

// export function AuthProvider({ children }: AuthProviderProps) {
//     const [token, setToken] = useState<string | null>(
//         localStorage.getItem("accessToken")
//     );
//     const [user, setUser] = useState<IUser | null>(getStoredUser());
//     const [loading, setLoading] = useState<boolean>(true);

//     const saveAuth = useCallback((newToken: string | null, newUser: IUser | null) => {
//         if (newToken) {
//             localStorage.setItem("accessToken", newToken);
//             setToken(newToken);
//         }

//         if (newUser) {
//             const normalized = normalizeUser(newUser);
//             localStorage.setItem("currentUser", JSON.stringify(normalized));
//             setUser(normalized);
//         }
//     }, []);

//     const clearAuth = useCallback(() => {
//         localStorage.removeItem("accessToken");
//         localStorage.removeItem("currentUser");
//         setToken(null);
//         setUser(null);
//     }, []);

//     const fetchMe = useCallback(async (): Promise<IUser> => {
//         const me = await authService.getMe();
//         const normalized = normalizeUser(me);
//         saveAuth(localStorage.getItem("accessToken"), normalized);
//         return normalized;
//     }, [saveAuth]);

//     const login = useCallback(
//         async (payload: ILoginPayload): Promise<IUser> => {
//             const result = await authService.login(payload);

//             if (result?.accessToken) {
//                 localStorage.setItem("accessToken", result.accessToken);
//                 setToken(result.accessToken);
//             }

//             if (result?.user) {
//                 const tempUser = normalizeUser(result.user);
//                 localStorage.setItem("currentUser", JSON.stringify(tempUser));
//                 setUser(tempUser);
//             }

//             try {
//                 const me = await authService.getMe();
//                 const normalized = normalizeUser(me);
//                 saveAuth(result.accessToken, normalized);
//                 return normalized;
//             } catch (error) {
//                 if (result?.user) {
//                     return normalizeUser(result.user);
//                 }
//                 throw error;
//             }
//         },
//         [saveAuth]
//     );

//     const logout = useCallback(() => {
//         clearAuth();
//     }, [clearAuth]);

//     useEffect(() => {
//         const initAuth = async () => {
//             const storedToken = localStorage.getItem("accessToken");

//             if (!storedToken) {
//                 setLoading(false);
//                 return;
//             }

//             try {
//                 await fetchMe();
//             } catch {
//                 clearAuth();
//             } finally {
//                 setLoading(false);
//             }
//         };

//         initAuth();
//     }, [fetchMe, clearAuth]);

//     const value = useMemo<IAuthContext>(
//         () => ({
//             token,
//             user,
//             loading,
//             isAuthenticated: !!token,
//             login,
//             logout,
//             fetchMe,
//             setUser,
//         }),
//         [token, user, loading, login, logout, fetchMe]
//     );

//     return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }

// export default AuthContext;


import {
    createContext,
    useCallback,
    useEffect,
    useMemo,
    useState,
    ReactNode,
} from "react";
import authService from "../services/authService";
import { normalizeUser } from "../utils/auth";
import { IAuthContext, IUser, ILoginPayload } from "../types/auth";

const AuthContext = createContext<IAuthContext | null>(null);

const getStoredUser = (): IUser | null => {
    try {
        const raw = localStorage.getItem("currentUser");
        return raw ? normalizeUser(JSON.parse(raw)) : null;
    } catch {
        return null;
    }
};

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [token, setToken] = useState<string | null>(
        localStorage.getItem("accessToken")
    );
    const [user, setUser] = useState<IUser | null>(getStoredUser());
    const [loading, setLoading] = useState<boolean>(true);

    const saveAuth = useCallback((newToken: string | null, newUser: IUser | null) => {
        if (newToken) {
            localStorage.setItem("accessToken", newToken);
        } else {
            localStorage.removeItem("accessToken");
        }
        setToken(newToken);

        if (newUser) {
            const normalized = normalizeUser(newUser);
            localStorage.setItem("currentUser", JSON.stringify(normalized));
            setUser(normalized);
        } else {
            localStorage.removeItem("currentUser");
            setUser(null);
        }
    }, []);

    const clearAuth = useCallback(() => {
        saveAuth(null, null);
    }, [saveAuth]);

    const fetchMe = useCallback(async (): Promise<IUser> => {
        const me = await authService.getMe();
        const normalized = normalizeUser(me);
        saveAuth(localStorage.getItem("accessToken"), normalized);
        return normalized;
    }, [saveAuth]);

    const login = useCallback(
        async (payload: ILoginPayload): Promise<IUser> => {
            const result = await authService.login(payload);

            if (result?.accessToken) {
                localStorage.setItem("accessToken", result.accessToken);
                setToken(result.accessToken);
            }

            if (result?.user) {
                const tempUser = normalizeUser(result.user);
                localStorage.setItem("currentUser", JSON.stringify(tempUser));
                setUser(tempUser);
            }

            try {
                const me = await authService.getMe();
                const normalized = normalizeUser(me);
                saveAuth(result.accessToken, normalized);
                return normalized;
            } catch (error) {
                if (result?.user) {
                    return normalizeUser(result.user);
                }
                throw error;
            }
        },
        [saveAuth]
    );

    const logout = useCallback(async () => {
        try {
            await authService.logout();
        } catch {
        } finally {
            clearAuth();
        }
    }, [clearAuth]);

    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem("accessToken");

            if (!storedToken) {
                setLoading(false);
                return;
            }

            try {
                await fetchMe();
            } catch {
                clearAuth();
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, [fetchMe, clearAuth]);

    const value = useMemo<IAuthContext>(
        () => ({
            token,
            user,
            loading,
            isAuthenticated: !!token,
            login,
            logout,
            fetchMe,
            setUser,
        }),
        [token, user, loading, login, logout, fetchMe, setUser]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;