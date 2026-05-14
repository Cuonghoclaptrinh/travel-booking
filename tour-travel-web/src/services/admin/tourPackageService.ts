import axiosClient from '../axiosClient';
import { TourPackage } from '../../types/tour-package';

export interface CreateTourPackagePayload {
    name: string;
    code: string;
    description?: string;
    priceAdult: number;
    priceChild: number;
    discountPercent?: number;
    hotelName?: string;
    hotelStandard?: string;
    hotelAddress?: string;
    hotelDescription?: string;
    roomType?: string;
    mealsIncluded?: string;
    allowGuideOption?: boolean;
    guideExtraPrice?: number;
    isDefault?: boolean;
    sortOrder?: number;
    status?: 'active' | 'inactive';
}

const tourPackageService = {
    async getByTourId(tourId: number): Promise<TourPackage[]> {
        const response = await axiosClient.get<TourPackage[]>(`/tours/admin/tours/${tourId}/packages`);
        return response.data;
    },

    async getById(tourId: number, packageId: number): Promise<TourPackage> {
        const response = await axiosClient.get<TourPackage>(`/tours/admin/tours/${tourId}/packages/${packageId}`);
        return response.data;
    },

    async create(tourId: number, payload: CreateTourPackagePayload): Promise<TourPackage> {
        const response = await axiosClient.post<TourPackage>(`/tours/admin/tours/${tourId}/packages`, payload);
        return response.data;
    },

    async update(
        tourId: number,
        packageId: number,
        payload: Partial<CreateTourPackagePayload>,
    ): Promise<TourPackage> {
        const response = await axiosClient.patch<TourPackage>(
            `/tours/admin/tours/${tourId}/packages/${packageId}`,
            payload,
        );
        return response.data;
    },

    async setDefault(tourId: number, packageId: number): Promise<TourPackage> {
        const response = await axiosClient.patch<TourPackage>(
            `/tours/admin/tours/${tourId}/packages/${packageId}/set-default`,
        );
        return response.data;
    },

    async remove(tourId: number, packageId: number): Promise<{ message: string }> {
        const response = await axiosClient.delete<{ message: string }>(
            `/tours/admin/tours/${tourId}/packages/${packageId}`,
        );
        return response.data;
    },
};

export default tourPackageService;
