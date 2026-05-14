import axiosClient from "../axiosClient";
import { PaginatedResponse } from "../../types/common";
import {
    CreateHotelPayload,
    HotelQueryParams,
    IHotel,
    IHotelAmenity,
    IHotelImage,
    ReplaceHotelAmenitiesPayload,
    UpdateHotelPayload,
} from "../../types/hotel";

const hotelsService = {
    async getPaging(query?: HotelQueryParams): Promise<PaginatedResponse<IHotel>> {
        const response = await axiosClient.get<PaginatedResponse<IHotel>>("/hotels", {
            params: query,
        });
        return response.data;
    },

    async getById(id: number): Promise<IHotel> {
        const response = await axiosClient.get<IHotel>(`/hotels/${id}`);
        return response.data;
    },

    async getByDestination(
        destinationId: number,
        query?: HotelQueryParams
    ): Promise<PaginatedResponse<IHotel>> {
        const response = await axiosClient.get<PaginatedResponse<IHotel>>(
            `/destinations/${destinationId}/hotels`,
            {
                params: query,
            }
        );
        return response.data;
    },

    async create(payload: CreateHotelPayload): Promise<IHotel> {
        const response = await axiosClient.post<IHotel>("/admin/hotels", payload);
        return response.data;
    },

    async update(id: number, payload: UpdateHotelPayload): Promise<IHotel> {
        const response = await axiosClient.patch<IHotel>(
            `/admin/hotels/${id}`,
            payload
        );
        return response.data;
    },

    async remove(id: number): Promise<{ message: string }> {
        const response = await axiosClient.delete<{ message: string }>(
            `/admin/hotels/${id}`
        );
        return response.data;
    },

    async getImages(hotelId: number): Promise<IHotelImage[]> {
        const response = await axiosClient.get<IHotelImage[]>(
            `/hotels/${hotelId}/images`
        );
        return response.data;
    },

    async uploadImage(
        hotelId: number,
        file: File,
        isDefault = false
    ): Promise<IHotelImage> {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("isDefault", String(isDefault));

        const response = await axiosClient.post<IHotelImage>(
            `/admin/hotels/${hotelId}/images`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        return response.data;
    },

    async setDefaultImage(imageId: number): Promise<{ message: string }> {
        const response = await axiosClient.post<{ message: string }>(
            `/admin/hotel-images/${imageId}/set-default`
        );
        return response.data;
    },

    async deleteImage(imageId: number): Promise<{ message: string }> {
        const response = await axiosClient.delete<{ message: string }>(
            `/admin/hotel-images/${imageId}`
        );
        return response.data;
    },

    async getAmenities(hotelId: number): Promise<IHotelAmenity[]> {
        const response = await axiosClient.get<IHotelAmenity[]>(
            `/hotels/${hotelId}/amenities`
        );
        return response.data;
    },

    async replaceAmenities(
        hotelId: number,
        payload: ReplaceHotelAmenitiesPayload
    ): Promise<{
        message: string;
        data: IHotelAmenity[];
    }> {
        const response = await axiosClient.put<{
            message: string;
            data: IHotelAmenity[];
        }>(`/admin/hotels/${hotelId}/amenities`, payload);

        return response.data;
    },
};

export default hotelsService;