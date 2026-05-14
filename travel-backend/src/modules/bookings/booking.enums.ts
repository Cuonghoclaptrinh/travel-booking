export enum BookingStatus {
    PENDING_PAYMENT = 'pending_payment',
    CONFIRMED = 'confirmed',
    EXPIRED = 'expired',
    CANCELLED = 'cancelled',
}

export enum PaymentStatus {
    UNPAID = 'unpaid',
    PAID = 'paid',
    EXPIRED = 'expired',
    CANCELLED = 'cancelled',
}

export enum PaymentMethod {
    BANK_TRANSFER = 'bank_transfer',
    CASH = 'cash',
    MOCK_GATEWAY = 'mock_gateway',
    VNPAY = 'vnpay',
}