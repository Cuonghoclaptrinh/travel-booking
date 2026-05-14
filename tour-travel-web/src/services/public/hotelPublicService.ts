import axiosClient from "../axiosClient";
import { PaginatedResponse } from "../../types/common";
import { IHotel, IHotelAmenity, IHotelImage, HotelQueryParams } from "../../types/hotel";

const hotelPublicService = {
    async getList(
        query?: HotelQueryParams
    ): Promise<PaginatedResponse<IHotel>> {
        const response = await axiosClient.get<PaginatedResponse<IHotel>>(
            "/hotels",
            {
                params: query,
            }
        );
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

    async getDetail(id: number): Promise<IHotel> {
        const response = await axiosClient.get<IHotel>(`/hotels/${id}`);
        return response.data;
    },

    async getImages(hotelId: number): Promise<IHotelImage[]> {
        const response = await axiosClient.get<IHotelImage[]>(
            `/hotels/${hotelId}/images`
        );
        return response.data;
    },

    async getAmenities(hotelId: number): Promise<IHotelAmenity[]> {
        const response = await axiosClient.get<IHotelAmenity[]>(
            `/hotels/${hotelId}/amenities`
        );
        return response.data;
    },
};

export default hotelPublicService;