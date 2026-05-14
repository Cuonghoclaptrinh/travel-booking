import axiosClient from '../axiosClient';
import { CreateTourPayload, Tour, TourPagingResponse, TourQueryParams } from '../../types/tour';

const baseUrl = '/tours/admin/tours';

const buildTourFormData = (
    payload: Partial<CreateTourPayload>,
    imageFile?: File | null,
) => {
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null) return;

        if (Array.isArray(value)) {
            formData.append(key, value.join(','));
            return;
        }

        formData.append(key, String(value));
    });

    if (imageFile) {
        formData.append('image', imageFile);
    }


    return formData;
};

const tourService = {
    async getPaging(params: TourQueryParams): Promise<TourPagingResponse> {
        const response = await axiosClient.get<TourPagingResponse>(baseUrl, { params });
        return response.data;
    },

    async getById(id: number): Promise<Tour> {
        const response = await axiosClient.get<Tour>(`${baseUrl}/${id}`);
        return response.data;
    },

    async create(payload: CreateTourPayload, imageFile?: File | null): Promise<Tour> {
        const formData = buildTourFormData(payload, imageFile);
        const response = await axiosClient.post<Tour>(baseUrl, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    async update(id: number, payload: Partial<CreateTourPayload>, imageFile?: File | null): Promise<Tour> {
        const formData = buildTourFormData(payload, imageFile);
        const response = await axiosClient.patch<Tour>(`${baseUrl}/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    async publish(id: number): Promise<Tour> {
        const response = await axiosClient.patch<Tour>(`${baseUrl}/${id}/publish`);
        return response.data;
    },

    async close(id: number): Promise<Tour> {
        const response = await axiosClient.patch<Tour>(`${baseUrl}/${id}/close`);
        return response.data;
    },

    async remove(id: number): Promise<{ message: string }> {
        const response = await axiosClient.delete<{ message: string }>(`${baseUrl}/${id}`);
        return response.data;
    },
};

export default tourService;
