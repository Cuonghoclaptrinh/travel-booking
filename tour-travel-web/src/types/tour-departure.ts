import type { DepartureOption } from './departure-option';

export type TourDepartureStatus =
    | 'draft'
    | 'open'
    | 'full'
    | 'closed'
    | 'cancelled';

export interface TourDeparture {
    id: number;
    tourId: number;
    code: string;
    departureDate: string;
    returnDate: string;
    registrationDeadline?: string;
    capacity: number;
    bookedSlots: number;
    availableSlots?: number;
    basePriceAdjustment: string;
    status: TourDepartureStatus;
    notes?: string;
    staffInChargeId?: number;
    options?: DepartureOption[];
}