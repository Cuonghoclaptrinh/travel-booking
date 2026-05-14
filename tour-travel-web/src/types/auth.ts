export interface IUser {
    id: string | number;
    name: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
    isVerified?: boolean;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
    roles: string[];
    permissions: string[];
}

export interface ILoginPayload {
    email: string;
    password: string;
}

export interface IRegisterPayload {
    name: string;
    email: string;
    password: string;
}

export interface ILoginResponse {
    user: Partial<IUser>;
    accessToken: string;
}

export interface IAuthContext {
    token: string | null;
    user: IUser | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (payload: ILoginPayload) => Promise<IUser>;
    logout: () => void;
    fetchMe: () => Promise<IUser>;
    setUser: React.Dispatch<React.SetStateAction<IUser | null>>;
}

export interface IUpdateMePayload {
    name?: string;
    email?: string;
    // phone?: string;
    password?: string;
}