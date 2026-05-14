import axiosClient from "../axiosClient";
import { PaginatedResponse } from "../../types/common";
import {
    CreatePermissionPayload,
    IPermission,
    PermissionQueryParams,
    UpdatePermissionPayload,
} from "../../types/permission";

const permissionsService = {
    async getPaging(
        query?: PermissionQueryParams
    ): Promise<PaginatedResponse<IPermission>> {
        const response = await axiosClient.get<PaginatedResponse<IPermission>>(
            "/permissions",
            {
                params: query,
            }
        );
        return response.data;
    },

    async getById(id: string): Promise<IPermission> {
        const response = await axiosClient.get<IPermission>(`/permissions/${id}`);
        return response.data;
    },

    async create(payload: CreatePermissionPayload): Promise<IPermission> {
        const response = await axiosClient.post<IPermission>(
            "/permissions",
            payload
        );
        return response.data;
    },

    async update(
        id: string,
        payload: UpdatePermissionPayload
    ): Promise<IPermission> {
        const response = await axiosClient.patch<IPermission>(
            `/permissions/${id}`,
            payload
        );
        return response.data;
    },

    async remove(id: string): Promise<{ message: string }> {
        const response = await axiosClient.delete<{ message: string }>(
            `/permissions/${id}`
        );
        return response.data;
    },
};

export default permissionsService;