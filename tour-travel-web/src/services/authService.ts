import axiosClient from "./axiosClient";
import {
    ILoginPayload,
    ILoginResponse,
    IRegisterPayload,
    IUser,
    IUpdateMePayload
} from "../types/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const authService = {
    async login(payload: ILoginPayload): Promise<ILoginResponse> {
        const response = await axiosClient.post<ILoginResponse>("/auth/login", payload);
        return response.data;
    },

    async register(payload: IRegisterPayload) {
        const response = await axiosClient.post("/auth/register", payload);
        return response.data;
    },

    continueWithGoogle() {
        window.location.href = `${API_URL}/auth/google`;
    },

    async getMe(): Promise<IUser> {
        const response = await axiosClient.get<IUser>("/auth/me");
        return response.data;
    },
    async updateMe(payload: IUpdateMePayload): Promise<IUser> {
        const response = await axiosClient.patch<IUser>("/auth/me", payload);
        return response.data;
    },

    async updateMyAvatar(file: File): Promise<IUser> {
        const formData = new FormData();
        formData.append("avatar", file);

        const response = await axiosClient.patch<IUser>("/auth/me/avatar", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return response.data;
    },

    async removeMyAvatar(): Promise<IUser> {
        const response = await axiosClient.delete<IUser>("/auth/me/avatar");
        return response.data;
    },
    async logout() {
        const response = await axiosClient.post("/auth/logout");
        return response.data;
    }
};

export default authService;