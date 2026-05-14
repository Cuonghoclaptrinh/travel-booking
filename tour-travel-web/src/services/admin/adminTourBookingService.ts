import axiosClient from '../axiosClient';

export interface AdminTourBookingOverviewItem {
    tourId: number;
    tourName: string;
    tourSlug: string;
    coverImageUrl?: string;
    destinationId?: number | null;
    departureCount: number;
    openDepartureCount: number;
    totalBookings: number;
    totalGuests: number;
    totalReservedSlots: number;
    totalPaidBookings: number;
    totalPaidAmount: string;
}

export interface AdminTourBookingOverviewResponse {
    items: AdminTourBookingOverviewItem[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface AdminTourDepartureItem {
    departureId: number;
    code: string;
    departureDate: string;
    returnDate: string;
    registrationDeadline?: string;
    status: string;
    capacity: number;
    bookedSlots: number;
    availableSlots: number;
    totalBookings: number;
    totalGuests: number;
    totalReservedSlots: number;
    totalPaidBookings: number;
    basePriceAdjustment?: string;
}

export interface AdminTourDeparturesResponse {
    tour: {
        id: number;
        name: string;
        slug: string;
        coverImageUrl?: string;
        destinationId?: number | null;
    };
    items: AdminTourDepartureItem[];
}

export interface AdminDepartureBookingItem {
    bookingId: number;
    bookingCode: string;
    userId: number | null;
    tourId: number | null;
    tourName: string;
    packageId: number | null;
    packageName?: string;
    departureId: number | null;
    optionId: number | null;
    departureCity?: string;
    transportType?: string;
    contactName: string;
    contactEmail: string;
    contactPhone?: string;
    adultCount: number;
    childCount: number;
    reservedSlots: number;
    unitPriceAdult?: string;
    unitPriceChild?: string;
    paymentStatus: string;
    paymentMethod?: string | null;
    bookingStatus?: string | null;
    notes?: string | null;
    createdAt: string;
    paidAmount?: string | null;
    paymentProvider?: string | null;
    paidAt?: string | null;
    optionLabel?: string | null;
}

export interface AdminDepartureBookingsResponse {
    departure: {
        id: number;
        tourId: number;
        code: string;
        departureDate: string;
        returnDate: string;
        registrationDeadline?: string;
        capacity: number;
        bookedSlots: number;
        status: string;
        basePriceAdjustment?: string;
    };
    items: AdminDepartureBookingItem[];
}

export interface QueryAdminTourBookingOverviewParams {
    search?: string;
    page?: number;
    limit?: number;
    destinationId?: number;
    bookingStatus?: string;
    paymentStatus?: string;
}

const adminTourBookingService = {
    async getTourOverview(
        params: QueryAdminTourBookingOverviewParams,
    ): Promise<AdminTourBookingOverviewResponse> {
        const response = await axiosClient.get<AdminTourBookingOverviewResponse>(
            '/admin/bookings/overview/tours',
            { params },
        );
        return response.data;
    },

    async getTourDepartures(tourId: number): Promise<AdminTourDeparturesResponse> {
        const response = await axiosClient.get<AdminTourDeparturesResponse>(
            `/admin/bookings/tours/${tourId}/departures`,
        );
        return response.data;
    },

    async getDepartureBookings(
        departureId: number,
    ): Promise<AdminDepartureBookingsResponse> {
        const response = await axiosClient.get<AdminDepartureBookingsResponse>(
            `/admin/bookings/departures/${departureId}/bookings`,
        );
        return response.data;
    },
};

export default adminTourBookingService;