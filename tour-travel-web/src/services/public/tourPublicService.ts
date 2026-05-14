import axiosClient from '../axiosClient';
import { Tour, TourPagingResponse, TourQueryParams } from '../../types/tour';

const baseUrl = '/tours';

const tourPublicService = {
    async getPaging(params: Omit<TourQueryParams, 'status'>): Promise<TourPagingResponse> {
        const response = await axiosClient.get<TourPagingResponse>(baseUrl, { params });
        return response.data;
    },

    async getBySlug(slug: string): Promise<Tour> {
        const response = await axiosClient.get<Tour>(`${baseUrl}/${slug}`);
        return response.data;
    },
};

export default tourPublicService;


