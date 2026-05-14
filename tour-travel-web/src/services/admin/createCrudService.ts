import axiosClient from "../axiosClient";
import { PaginatedResponse, PaginationQuery } from "../../types/common";

export function createCrudService<
    TItem,
    TCreatePayload,
    TUpdatePayload,
    TQuery extends PaginationQuery = PaginationQuery
>(baseUrl: string) {
    return {
        async getPaging(query?: TQuery): Promise<PaginatedResponse<TItem>> {
            const response = await axiosClient.get<PaginatedResponse<TItem>>(baseUrl, {
                params: query,
            });
            return response.data;
        },

        async getById(id: string | number): Promise<TItem> {
            const response = await axiosClient.get<TItem>(`${baseUrl}/${id}`);
            return response.data;
        },

        async create(payload: TCreatePayload): Promise<TItem> {
            const response = await axiosClient.post<TItem>(baseUrl, payload);
            return response.data;
        },

        async update(
            id: string | number,
            payload: TUpdatePayload
        ): Promise<TItem> {
            const response = await axiosClient.patch<TItem>(
                `${baseUrl}/${id}`,
                payload
            );
            return response.data;
        },

        async remove(id: string | number): Promise<void> {
            await axiosClient.delete(`${baseUrl}/${id}`);
        },
    };
}