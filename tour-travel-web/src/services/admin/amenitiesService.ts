import axiosClient from "../axiosClient";
import { PaginatedResponse } from "../../types/common";
import {
    AmenityQueryParams,
    CreateAmenityPayload,
    IAmenity,
    UpdateAmenityPayload,
} from "../../types/amenity";

const amenitiesService = {
    async getPaging(
        query?: AmenityQueryParams
    ): Promise<PaginatedResponse<IAmenity>> {
        const response = await axiosClient.get<PaginatedResponse<IAmenity>>(
            "/amenities",
            {
                params: query,
            }
        );
        return response.data;
    },

    async getById(id: number): Promise<IAmenity> {
        const response = await axiosClient.get<IAmenity>(`/amenities/${id}`);
        return response.data;
    },

    async create(payload: CreateAmenityPayload): Promise<IAmenity> {
        const response = await axiosClient.post<IAmenity>(
            "/admin/amenities",
            payload
        );
        return response.data;
    },

    async update(
        id: number,
        payload: UpdateAmenityPayload
    ): Promise<IAmenity> {
        const response = await axiosClient.patch<IAmenity>(
            `/admin/amenities/${id}`,
            payload
        );
        return response.data;
    },

    async remove(id: number): Promise<{ message: string }> {
        const response = await axiosClient.delete<{ message: string }>(
            `/admin/amenities/${id}`
        );
        return response.data;
    },
};

export default amenitiesService;