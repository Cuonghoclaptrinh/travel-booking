import axiosClient from '../axiosClient';

export interface TourImage {
    id: number;
    tourId: number;
    url: string;
    publicId?: string;
    isDefault: boolean;
    sortOrder: number;
    createdAt?: string;
}

const tourImageService = {
    async getByTourId(tourId: number): Promise<TourImage[]> {
        const response = await axiosClient.get<TourImage[]>(
            `/tours/admin/tours/${tourId}/images`,
        );

        return response.data;
    },

    async uploadMany(tourId: number, files: File[]): Promise<TourImage[]> {
        const formData = new FormData();

        files.forEach((file) => {
            formData.append('images', file);
        });

        const response = await axiosClient.post<TourImage[]>(
            `/tours/admin/tours/${tourId}/images`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            },
        );

        return response.data;
    },

    async setDefault(tourId: number, imageId: number): Promise<TourImage> {
        const response = await axiosClient.patch<TourImage>(
            `/tours/admin/tours/${tourId}/images/${imageId}/set-default`,
        );

        return response.data;
    },

    async remove(tourId: number, imageId: number): Promise<{ message: string }> {
        const response = await axiosClient.delete<{ message: string }>(
            `/tours/admin/tours/${tourId}/images/${imageId}`,
        );

        return response.data;
    },
};

export default tourImageService;