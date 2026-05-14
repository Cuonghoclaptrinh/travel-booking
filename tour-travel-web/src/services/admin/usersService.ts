import axiosClient from "../axiosClient";
import { PaginatedResponse } from "../../types/common";
import {
    AssignRolesPayload,
    CreateUserPayload,
    IUser,
    UpdateUserPayload,
    UserQueryParams,
    UserRolesResponse,
} from "../../types/user";

const usersService = {
    async getPaging(query?: UserQueryParams): Promise<PaginatedResponse<IUser>> {
        const response = await axiosClient.get<PaginatedResponse<IUser>>("/users", {
            params: query,
        });
        return response.data;
    },

    async getById(id: string): Promise<IUser> {
        const response = await axiosClient.get<IUser>(`/users/${id}`);
        return response.data;
    },

    async create(payload: CreateUserPayload): Promise<IUser> {
        const response = await axiosClient.post<IUser>("/users", payload);
        return response.data;
    },

    async update(id: string, payload: UpdateUserPayload): Promise<IUser> {
        const response = await axiosClient.patch<IUser>(`/users/${id}`, payload);
        return response.data;
    },

    async remove(id: string): Promise<{ message: string }> {
        const response = await axiosClient.delete<{ message: string }>(`/users/${id}`);
        return response.data;
    },

    async getRoles(id: string): Promise<UserRolesResponse> {
        const response = await axiosClient.get<UserRolesResponse>(`/users/${id}/roles`);
        return response.data;
    },

    async assignRoles(
        id: string,
        payload: AssignRolesPayload
    ): Promise<UserRolesResponse> {
        const response = await axiosClient.post<UserRolesResponse>(
            `/users/${id}/roles`,
            payload
        );
        return response.data;
    },
};

export default usersService;