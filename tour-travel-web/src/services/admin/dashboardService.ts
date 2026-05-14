import axiosClient from "../axiosClient";

export type DashboardRange =
    | "today"
    | "7d"
    | "30d"
    | "this_month"
    | "last_month"
    | "3m"
    | "6m"
    | "this_year"
    | "custom";

export interface DashboardOverviewParams {
    range?: DashboardRange;
    from?: string;
    to?: string;
}

export interface DashboardOverview {
    range?: {
        type: DashboardRange;
        from: string;
        to: string;
    };
    stats: {
        totalUsers: number;
        totalTours: number;
        totalBookings: number;
        totalRevenue: number;
        paidBookings: number;
        pendingPaymentBookings: number;
        expiredBookings: number;
        cancelledBookings: number;
    };
    revenueByDay?: {
        date: string;
        revenue: number;
        bookingCount: number;
    }[];
    revenueLast7Days: {
        date: string;
        revenue: number;
        bookingCount: number;
    }[];
    actionItems: {
        id: string | number;
        code: string;
        contactName: string;
        contactEmail: string;
        contactPhone?: string;
        tourName?: string | null;
        totalAmount: number;
        paymentMethod?: string | null;
        bookingStatus: string;
        paymentStatus: string;
        expiresAt?: string;
        createdAt: string;
    }[];
    upcomingDepartures: {
        departureId: string | number;
        tourId: string | number;
        tourName?: string | null;
        code: string;
        departureDate: string;
        returnDate: string;
        capacity: number;
        bookedSlots: number;
        availableSlots: number;
        status: string;
    }[];
    topToursByRevenue: {
        tourId: string | number;
        tourName: string;
        bookingCount: number;
        guestCount: number;
        revenue: number;
    }[];
}

const dashboardService = {
    async getOverview(params?: DashboardOverviewParams): Promise<DashboardOverview> {
        const response = await axiosClient.get<DashboardOverview>(
            "/admin/dashboard/overview",
            {
                params,
            },
        );

        return response.data;
    },
};

export default dashboardService;