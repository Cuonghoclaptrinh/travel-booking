export type BookingStatus =
    | 'pending_payment'
    | 'confirmed'
    | 'expired'
    | 'cancelled';

export type PaymentStatus =
    | 'unpaid'
    | 'paid'
    | 'expired'
    | 'cancelled';

export type PaymentMethod =
    | 'bank_transfer'
    | 'cash'
    | 'mock_gateway'
    | 'vnpay';

export interface Booking {
    id: number;
    code: string;
    userId: number;
    tourId: number;
    packageId: number;
    departureId: number;
    optionId: number;
    contactName: string;
    contactEmail: string;
    contactPhone?: string;
    adultCount: number;
    childCount: number;
    reservedSlots: number;
    isPrivateGuide: boolean;
    unitPriceAdult: string;
    unitPriceChild: string;
    departurePriceAdjustment: string;
    optionExtraPrice: string;
    guideExtraPrice: string;
    totalAmount: string;
    bookingStatus: BookingStatus;
    paymentStatus: PaymentStatus;
    paymentMethod?: PaymentMethod;
    paymentReference?: string;
    expiresAt: string;
    paidAt?: string;
    cancelledAt?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;

    user?: {
        id: number;
        name: string;
        email: string;
    };

    tour?: {
        id: number;
        name?: string;
        title?: string;
        slug?: string;
        imageUrl?: string;
    };

    tourPackage?: {
        id: number;
        name?: string;
        title?: string;
    };

    departure?: {
        id: number;
        departureDate?: string;
        startDate?: string;
        capacity?: number;
    };

    departureOption?: {
        id: number;
        name?: string;
        title?: string;
    };
}

export interface BookingPagingResponse {
    items: Booking[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface MyBookingQueryParams {
    bookingStatus?: BookingStatus | null;
    paymentStatus?: PaymentStatus | null;
    page?: number;
    limit?: number;
}

export interface AdminBookingQueryParams extends MyBookingQueryParams {
    code?: string;
    userId?: number;
    tourId?: number;
    departureId?: number;
    contactEmail?: string;
    createdFrom?: string;
    createdTo?: string;
}

export interface CreateBookingPayload {
    tourId: number;
    packageId: number;
    departureId: number;
    optionId: number;
    adultCount: number;
    childCount?: number;
    isPrivateGuide?: boolean;
    contactName: string;
    contactEmail: string;
    contactPhone?: string;
    notes?: string;
}

export interface PayBookingPayload {
    paymentMethod: PaymentMethod;
    paymentReference?: string;
}

export interface AdminConfirmPaymentPayload {
    paymentMethod: PaymentMethod;
    paymentReference?: string;
    note?: string;
}

export interface AdminCancelBookingPayload {
    reason?: string;
}

export interface CreateVnpayPaymentUrlPayload {
    bankCode?: string;
    language?: 'vn' | 'en';
}

export interface CreateVnpayPaymentUrlResponse {
    paymentUrl: string;
    paymentId: number;
    transactionRef: string;
    bookingId: number;
    bookingCode: string;
    amount: number;
    expiresAt: string;
}

export interface VnpayReturnResult {
    validSignature: boolean;
    success: boolean;
    responseCode: string;
    transactionStatus: string;
    transactionRef: string;
    paymentId: number | null;
    bookingId: number | null;
    bookingCode: string | null;
    amount: number | null;
    transactionNo: string | null;
    bankCode: string | null;
    payDate: string | null;
}

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
    paidAt?: string;
    expiredAt?: string;
    createdAt: string;
    updatedAt: string;
}