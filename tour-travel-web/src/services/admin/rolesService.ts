import axiosClient from "../axiosClient";
import { PaginatedResponse } from "../../types/common";
import {
    AssignPermissionsPayload,
    CreateRolePayload,
    IRole,
    RolePermissionsResponse,
    RoleQueryParams,
    UpdateRolePayload,
} from "../../types/role";

const rolesService = {
    async getPaging(query?: RoleQueryParams): Promise<PaginatedResponse<IRole>> {
        const response = await axiosClient.get<PaginatedResponse<IRole>>("/roles", {
            params: query,
        });
        return response.data;
    },

    async getById(id: string): Promise<IRole> {
        const response = await axiosClient.get<IRole>(`/roles/${id}`);
        return response.data;
    },

    async create(payload: CreateRolePayload): Promise<IRole> {
        const response = await axiosClient.post<IRole>("/roles", payload);
        return response.data;
    },

    async update(id: string, payload: UpdateRolePayload): Promise<IRole> {
        const response = await axiosClient.patch<IRole>(`/roles/${id}`, payload);
        return response.data;
    },

    async remove(id: string): Promise<{ message: string }> {
        const response = await axiosClient.delete<{ message: string }>(`/roles/${id}`);
        return response.data;
    },

    async getPermissions(id: string): Promise<RolePermissionsResponse> {
        const response = await axiosClient.get<RolePermissionsResponse>(
            `/roles/${id}/permissions`
        );
        return response.data;
    },

    async assignPermissions(
        id: string,
        payload: AssignPermissionsPayload
    ): Promise<RolePermissionsResponse> {
        const response = await axiosClient.post<RolePermissionsResponse>(
            `/roles/${id}/permissions`,
            payload
        );
        return response.data;
    },
};

export default rolesService;