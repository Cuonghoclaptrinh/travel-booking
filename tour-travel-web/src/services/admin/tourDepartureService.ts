import axiosClient from '../axiosClient';
import { TourDeparture } from '../../types/tour-departure';

export interface CreateTourDeparturePayload {
    code: string;
    departureDate: string;
    returnDate: string;
    registrationDeadline?: string;
    capacity: number;
    basePriceAdjustment?: number;
    status?: 'draft' | 'open' | 'full' | 'closed' | 'cancelled';
    notes?: string;
    staffInChargeId?: number;
}

// const sanitizePayload = (
//     payload: Partial<CreateTourDeparturePayload>,
// ): Partial<CreateTourDeparturePayload> => ({
//     ...payload,
//     registrationDeadline: payload.registrationDeadline || undefined,
//     staffInChargeId:
//         payload.staffInChargeId && payload.staffInChargeId > 0
//             ? payload.staffInChargeId
//             : 0,
// });

const sanitizePayload = (
    payload: Partial<CreateTourDeparturePayload>,
): Partial<CreateTourDeparturePayload> => ({
    ...payload,

    // chỉ thêm nếu có giá trị
    ...(payload.registrationDeadline
        ? { registrationDeadline: payload.registrationDeadline }
        : {}),

    // chỉ thêm nếu > 0
    ...(payload.staffInChargeId && payload.staffInChargeId > 0
        ? { staffInChargeId: payload.staffInChargeId }
        : {}),
});

const tourDepartureService = {
    async getByTourId(tourId: number): Promise<TourDeparture[]> {
        const response = await axiosClient.get<TourDeparture[]>(`/tours/admin/tours/${tourId}/departures`);
        return response.data;
    },

    async getById(tourId: number, departureId: number): Promise<TourDeparture> {
        const response = await axiosClient.get<TourDeparture>(`/tours/admin/tours/${tourId}/departures/${departureId}`);
        return response.data;
    },

    async create(tourId: number, payload: CreateTourDeparturePayload): Promise<TourDeparture> {
        const response = await axiosClient.post<TourDeparture>(
            `/tours/admin/tours/${tourId}/departures`,
            sanitizePayload(payload),
        );
        return response.data;
    },

    async update(
        tourId: number,
        departureId: number,
        payload: Partial<CreateTourDeparturePayload>,
    ): Promise<TourDeparture> {
        const response = await axiosClient.patch<TourDeparture>(
            `/tours/admin/tours/${tourId}/departures/${departureId}`,
            sanitizePayload(payload),
        );
        return response.data;
    },

    async open(tourId: number, departureId: number): Promise<TourDeparture> {
        const response = await axiosClient.patch<TourDeparture>(
            `/tours/admin/tours/${tourId}/departures/${departureId}/open`,
        );
        return response.data;
    },

    async close(tourId: number, departureId: number): Promise<TourDeparture> {
        const response = await axiosClient.patch<TourDeparture>(
            `/tours/admin/tours/${tourId}/departures/${departureId}/close`,
        );
        return response.data;
    },

    async cancel(tourId: number, departureId: number): Promise<TourDeparture> {
        const response = await axiosClient.patch<TourDeparture>(
            `/tours/admin/tours/${tourId}/departures/${departureId}/cancel`,
        );
        return response.data;
    },

    async remove(tourId: number, departureId: number): Promise<{ message: string }> {
        const response = await axiosClient.delete<{ message: string }>(
            `/tours/admin/tours/${tourId}/departures/${departureId}`,
        );
        return response.data;
    },
};

export default tourDepartureService;
