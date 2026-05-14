import axiosClient from "../axiosClient";
import {
    DestinationQueryParams,
    IDestination,
    IDestinationImage,
} from "../../types/destination";
import { PaginatedResponse } from "../../types/common";

const destinationPublicService = {
    async getList(
        query?: DestinationQueryParams
    ): Promise<PaginatedResponse<IDestination>> {
        const response = await axiosClient.get<PaginatedResponse<IDestination>>(
            "/destinations/destinations",
            {
                params: query,
            }
        );
        return response.data;
    },

    async getDetail(id: number): Promise<IDestination> {
        const response = await axiosClient.get<IDestination>(
            `/destinations/destinations/${id}`
        );
        return response.data;
    },

    async getImages(destinationId: number): Promise<IDestinationImage[]> {
        const response = await axiosClient.get<IDestinationImage[]>(
            `/destinations/${destinationId}/images`
        );
        return response.data;
    },
};

export default destinationPublicService;