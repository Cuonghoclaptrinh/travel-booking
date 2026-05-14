export type DepartureOptionStatus = 'active' | 'inactive';
export type TransportType = 'bus' | 'limousine' | 'flight' | 'self_arrival';

export interface DepartureOption {
    id: number;
    departureId: number;
    departureCity: string;
    transportType: TransportType;
    extraPrice: string;
    meetingPoint?: string;
    startTime?: string;
    endTime?: string;
    notes?: string;
    status: DepartureOptionStatus;
}