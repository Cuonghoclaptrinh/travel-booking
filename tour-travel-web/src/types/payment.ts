import { Booking } from './booking';

export type PaymentProvider =
    | 'vnpay'
    | 'momo'
    | 'zalopay'
    | 'bank_transfer'
    | 'cash'
    | 'mock';

export type PaymentTransactionStatus =
    | 'pending'
    | 'success'
    | 'failed'
    | 'cancelled'
    | 'expired'
    | 'refunded';

export interface PaymentTransaction {
    id: number;
    bookingId: number;
    provider: PaymentProvider;
    status: PaymentTransactionStatus;
    transactionRef: string;
    providerTransactionId?: string;
    amount: string;
    currency: string;
    paymentUrl?: string;
    rawRequest?: any;
    rawResponse?: any;
    rawIpn?: any;
    paidAt?: string;
    expiredAt?: string;
    createdAt: string;
    updatedAt: string;
    booking?: Booking;
}

export interface AdminPaymentQueryParams {
    transactionRef?: string;
    providerTransactionId?: string;
    bookingId?: number;
    bookingCode?: string;
    userId?: number;
    tourId?: number;
    provider?: PaymentProvider;
    status?: PaymentTransactionStatus;
    createdFrom?: string;
    createdTo?: string;
    paidFrom?: string;
    paidTo?: string;
    page?: number;
    limit?: number;
}

export interface AdminPaymentPagingResponse {
    items: PaymentTransaction[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}