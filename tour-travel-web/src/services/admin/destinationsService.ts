// import axiosClient from "../axiosClient";
// import { PaginatedResponse } from "../../types/common";
// import {
//     CreateDestinationPayload,
//     DestinationQueryParams,
//     IDestination,
//     IDestinationImage,
//     UpdateDestinationPayload,
// } from "../../types/destination";

// const destinationsService = {
//     async getPaging(
//         query?: DestinationQueryParams
//     ): Promise<PaginatedResponse<IDestination>> {
//         const response = await axiosClient.get<PaginatedResponse<IDestination>>(
//             "/destinations/destinations",
//             {
//                 params: query,
//             }
//         );
//         return response.data;
//     },

//     async getById(id: number): Promise<IDestination> {
//         const response = await axiosClient.get<IDestination>(
//             `/destinations/destinations/${id}`
//         );
//         return response.data;
//     },

//     async create(payload: CreateDestinationPayload): Promise<IDestination> {
//         const response = await axiosClient.post<IDestination>(
//             "/destinations/admin/destinations",
//             payload
//         );
//         return response.data;
//     },

//     async update(
//         id: number,
//         payload: UpdateDestinationPayload
//     ): Promise<IDestination> {
//         const response = await axiosClient.patch<IDestination>(
//             `/destinations/admin/destinations/${id}`,
//             payload
//         );
//         return response.data;
//     },

//     async remove(id: number): Promise<{ message: string }> {
//         const response = await axiosClient.delete<{ message: string }>(
//             `/destinations/admin/destinations/${id}`
//         );
//         return response.data;
//     },

//     async getImages(destinationId: number): Promise<IDestinationImage[]> {
//         const response = await axiosClient.get<IDestinationImage[]>(
//             `/destinations/${destinationId}/images`
//         );
//         return response.data;
//     },

//     async uploadImage(
//         destinationId: number,
//         file: File,
//         isDefault = false
//     ): Promise<IDestinationImage> {
//         const formData = new FormData();
//         formData.append("file", file);
//         formData.append("isDefault", String(isDefault));

//         const response = await axiosClient.post<IDestinationImage>(
//             `/admin/destinations/${destinationId}/images`,
//             formData,
//             {
//                 headers: {
//                     "Content-Type": "multipart/form-data",
//                 },
//             }
//         );

//         return response.data;
//     },

//     async setDefaultImage(imageId: number): Promise<{ message: string }> {
//         const response = await axiosClient.post<{ message: string }>(
//             `/admin/destination-images/${imageId}/set-default`
//         );
//         return response.data;
//     },

//     async deleteImage(imageId: number): Promise<{ message: string }> {
//         const response = await axiosClient.delete<{ message: string }>(
//             `/admin/destination-images/${imageId}`
//         );
//         return response.data;
//     },
// };

// export default destinationsService;



import axiosClient from "../axiosClient";
import { PaginatedResponse } from "../../types/common";
import {
    CreateDestinationPayload,
    DestinationQueryParams,
    IDestination,
    IDestinationImage,
    UpdateDestinationPayload,
} from "../../types/destination";

const destinationsService = {
    async getPaging(
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

    async getById(id: number): Promise<IDestination> {
        const response = await axiosClient.get<IDestination>(
            `/destinations/destinations/${id}`
        );

        return response.data;
    },

    async create(payload: CreateDestinationPayload): Promise<IDestination> {
        const response = await axiosClient.post<IDestination>(
            "/destinations/admin/destinations",
            payload
        );

        return response.data;
    },

    async update(
        id: number,
        payload: UpdateDestinationPayload
    ): Promise<IDestination> {
        const response = await axiosClient.patch<IDestination>(
            `/destinations/admin/destinations/${id}`,
            payload
        );

        return response.data;
    },

    async remove(id: number): Promise<{ message: string }> {
        const response = await axiosClient.delete<{ message: string }>(
            `/destinations/admin/destinations/${id}`
        );

        return response.data;
    },

    async getImages(destinationId: number): Promise<IDestinationImage[]> {
        const response = await axiosClient.get<IDestinationImage[]>(
            `/destinations/${destinationId}/images`
        );

        return response.data;
    },

    async uploadImage(
        destinationId: number,
        file: File,
        isDefault = false
    ): Promise<IDestinationImage> {
        const formData = new FormData();

        formData.append("file", file);
        formData.append("isDefault", String(isDefault));

        const response = await axiosClient.post<IDestinationImage>(
            `/admin/destinations/${destinationId}/images`,
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
            `/admin/destination-images/${imageId}/set-default`
        );

        return response.data;
    },

    async deleteImage(imageId: number): Promise<{ message: string }> {
        const response = await axiosClient.delete<{ message: string }>(
            `/admin/destination-images/${imageId}`
        );

        return response.data;
    },
};

export default destinationsService;