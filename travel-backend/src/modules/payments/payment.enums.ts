export enum PaymentProvider {
    VNPAY = 'vnpay',
    PAYOS = 'payos',
    MOMO = 'momo',
    ZALOPAY = 'zalopay',
    BANK_TRANSFER = 'bank_transfer',
    CASH = 'cash',
    MOCK = 'mock',
}

export enum PaymentTransactionStatus {
    PENDING = 'pending',
    SUCCESS = 'success',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
    EXPIRED = 'expired',
    REFUNDED = 'refunded',
}