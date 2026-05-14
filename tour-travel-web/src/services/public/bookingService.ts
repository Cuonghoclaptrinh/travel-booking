import axiosClient from '../axiosClient';
import {
    AdminBookingQueryParams,
    AdminCancelBookingPayload,
    AdminConfirmPaymentPayload,
    Booking,
    BookingPagingResponse,
    CreateBookingPayload,
    CreateVnpayPaymentUrlPayload,
    CreateVnpayPaymentUrlResponse,
    MyBookingQueryParams,
    PayBookingPayload,
    PaymentTransaction,
    VnpayReturnResult,
} from '../../types/booking';

const userBaseUrl = '/bookings';
const adminBaseUrl = '/admin/bookings';
const paymentBaseUrl = '/payments';

const bookingService = {
    async create(payload: CreateBookingPayload): Promise<Booking> {
        const response = await axiosClient.post<Booking>(userBaseUrl, payload);
        return response.data;
    },

    async getMyBookings(params: MyBookingQueryParams): Promise<BookingPagingResponse> {
        const response = await axiosClient.get<BookingPagingResponse>(`${userBaseUrl}/my`, {
            params,
        });
        return response.data;
    },

    async getMyBookingById(id: number): Promise<Booking> {
        const response = await axiosClient.get<Booking>(`${userBaseUrl}/my/${id}`);
        return response.data;
    },

    async payMyBooking(id: number, payload: PayBookingPayload): Promise<Booking> {
        const response = await axiosClient.post<Booking>(
            `${userBaseUrl}/my/${id}/pay`,
            payload,
        );
        return response.data;
    },

    async cancelMyBooking(id: number): Promise<Booking> {
        const response = await axiosClient.post<Booking>(`${userBaseUrl}/my/${id}/cancel`);
        return response.data;
    },

    async getAdminBookings(
        params: AdminBookingQueryParams,
    ): Promise<BookingPagingResponse> {
        const response = await axiosClient.get<BookingPagingResponse>(adminBaseUrl, {
            params,
        });
        return response.data;
    },

    async getAdminBookingById(id: number): Promise<Booking> {
        const response = await axiosClient.get<Booking>(`${adminBaseUrl}/${id}`);
        return response.data;
    },

    async confirmPaymentByAdmin(
        id: number,
        payload: AdminConfirmPaymentPayload,
    ): Promise<Booking> {
        const response = await axiosClient.post<Booking>(
            `${adminBaseUrl}/${id}/confirm-payment`,
            payload,
        );
        return response.data;
    },

    async cancelByAdmin(
        id: number,
        payload: AdminCancelBookingPayload,
    ): Promise<Booking> {
        const response = await axiosClient.post<Booking>(
            `${adminBaseUrl}/${id}/cancel`,
            payload,
        );
        return response.data;
    },

    async expireByAdmin(id: number): Promise<Booking> {
        const response = await axiosClient.post<Booking>(`${adminBaseUrl}/${id}/expire`);
        return response.data;
    },

    async createVnpayPaymentUrl(
        bookingId: number,
        payload: CreateVnpayPaymentUrlPayload,
    ): Promise<CreateVnpayPaymentUrlResponse> {
        const response = await axiosClient.post<CreateVnpayPaymentUrlResponse>(
            `${paymentBaseUrl}/bookings/${bookingId}/vnpay/create-url`,
            payload,
        );

        return response.data;
    },

    async verifyVnpayReturn(params: URLSearchParams): Promise<VnpayReturnResult> {
        const response = await axiosClient.get<VnpayReturnResult>(
            `${paymentBaseUrl}/vnpay/return?${params.toString()}`,
        );

        return response.data;
    },

    async getPaymentsByBooking(bookingId: number): Promise<PaymentTransaction[]> {
        const response = await axiosClient.get<PaymentTransaction[]>(
            `${paymentBaseUrl}/bookings/${bookingId}`,
        );

        return response.data;
    },

    async createPayosPaymentUrl(bookingId: number): Promise<{
        paymentId: string | number;
        bookingId: string | number;
        bookingCode: string;
        provider: string;
        transactionRef: string;
        amount: number;
        checkoutUrl: string;
    }> {
        const response = await axiosClient.post(
            `/payments/bookings/${bookingId}/payos/create-url`,
        );

        return response.data;
    },

    async createMockPayosPaymentUrl(bookingId: number): Promise<{
        paymentId: string | number;
        bookingId: string | number;
        bookingCode: string;
        provider: string;
        transactionRef: string;
        amount: number;
        checkoutUrl: string;
    }> {
        const response = await axiosClient.post(
            `/payments/bookings/${bookingId}/mock-payos/create-url`,
        );

        return response.data;
    },

    async confirmMockPayosPayment(transactionRef: string): Promise<{
        success: boolean;
        message: string;
        paymentId: string | number;
        bookingId: string | number;
        bookingCode: string;
    }> {
        const response = await axiosClient.post(
            `/payments/mock-payos/${encodeURIComponent(transactionRef)}/confirm`,
        );

        return response.data;
    },
};

export default bookingService;