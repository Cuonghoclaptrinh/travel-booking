import axiosClient from '../axiosClient';
import { DepartureOption } from '../../types/departure-option';

export interface CreateDepartureOptionPayload {
    departureCity: string;
    transportType: 'bus' | 'limousine' | 'flight' | 'self_arrival';
    extraPrice?: number;
    meetingPoint?: string;
    startTime?: string;
    endTime?: string;
    notes?: string;
    status?: 'active' | 'inactive';
}

const sanitizePayload = (
    payload: Partial<CreateDepartureOptionPayload>,
): Partial<CreateDepartureOptionPayload> => ({
    ...payload,
    startTime: payload.startTime || new Date().toISOString(),
    endTime: payload.endTime || new Date().toISOString(),
});

const departureOptionService = {
    async getByDepartureId(departureId: number): Promise<DepartureOption[]> {
        const response = await axiosClient.get<DepartureOption[]>(`/tours/admin/departures/${departureId}/options`);
        return response.data;
    },

    async getById(departureId: number, optionId: number): Promise<DepartureOption> {
        const response = await axiosClient.get<DepartureOption>(`/tours/admin/departures/${departureId}/options/${optionId}`);
        return response.data;
    },

    async create(
        departureId: number,
        payload: CreateDepartureOptionPayload,
    ): Promise<DepartureOption> {
        const response = await axiosClient.post<DepartureOption>(
            `/tours/admin/departures/${departureId}/options`,
            sanitizePayload(payload),
        );
        return response.data;
    },

    async update(
        departureId: number,
        optionId: number,
        payload: Partial<CreateDepartureOptionPayload>,
    ): Promise<DepartureOption> {
        const response = await axiosClient.patch<DepartureOption>(
            `/tours/admin/departures/${departureId}/options/${optionId}`,
            sanitizePayload(payload),
        );
        return response.data;
    },

    async remove(
        departureId: number,
        optionId: number,
    ): Promise<{ message: string }> {
        const response = await axiosClient.delete<{ message: string }>(
            `/tours/admin/departures/${departureId}/options/${optionId}`,
        );
        return response.data;
    },
};

export default departureOptionService;
