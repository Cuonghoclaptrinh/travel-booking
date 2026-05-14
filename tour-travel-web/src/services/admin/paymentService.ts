import axiosClient from '../axiosClient';
import {
    AdminPaymentPagingResponse,
    AdminPaymentQueryParams,
    PaymentTransaction,
} from '../../types/payment';

const adminBaseUrl = '/admin/payments';

const paymentService = {
    async getAdminPayments(
        params: AdminPaymentQueryParams,
    ): Promise<AdminPaymentPagingResponse> {
        const response = await axiosClient.get<AdminPaymentPagingResponse>(
            adminBaseUrl,
            { params },
        );

        return response.data;
    },

    async getAdminPaymentById(id: number): Promise<PaymentTransaction> {
        const response = await axiosClient.get<PaymentTransaction>(
            `${adminBaseUrl}/${id}`,
        );

        return response.data;
    },

    async getPaymentsByBookingForAdmin(
        bookingId: number,
    ): Promise<PaymentTransaction[]> {
        const response = await axiosClient.get<PaymentTransaction[]>(
            `${adminBaseUrl}/booking/${bookingId}`,
        );

        return response.data;
    },
};

export default paymentService;