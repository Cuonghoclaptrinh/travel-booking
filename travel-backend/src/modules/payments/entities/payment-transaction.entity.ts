import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';
import { PaymentProvider, PaymentTransactionStatus } from '../payment.enums';

@Entity('payment_transactions')
@Index('idx_payment_transactions_booking_id', ['bookingId'])
@Index('idx_payment_transactions_provider', ['provider'])
@Index('idx_payment_transactions_status', ['status'])
@Index('idx_payment_transactions_transaction_ref', ['transactionRef'], {
    unique: true,
})
export class PaymentTransaction {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: number;

    @Column({ name: 'booking_id', type: 'bigint', unsigned: true })
    bookingId!: number;

    @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'booking_id' })
    booking!: Booking;

    @Column({ type: 'varchar', length: 30 })
    provider!: PaymentProvider;

    @Column({ type: 'varchar', length: 30 })
    status!: PaymentTransactionStatus;

    @Column({ name: 'transaction_ref', type: 'varchar', length: 100, unique: true })
    transactionRef!: string;

    @Column({
        name: 'provider_transaction_id',
        type: 'varchar',
        length: 100,
        nullable: true,
    })
    providerTransactionId?: string;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    amount!: string;

    @Column({ type: 'varchar', length: 10, default: 'VND' })
    currency!: string;

    @Column({ name: 'payment_url', type: 'text', nullable: true })
    paymentUrl?: string;

    @Column({ name: 'raw_request', type: 'json', nullable: true })
    rawRequest?: any;

    @Column({ name: 'raw_response', type: 'json', nullable: true })
    rawResponse?: any;

    @Column({ name: 'raw_ipn', type: 'json', nullable: true })
    rawIpn?: any;

    @Column({ name: 'paid_at', type: 'datetime', nullable: true })
    paidAt?: Date;

    @Column({ name: 'expired_at', type: 'datetime', nullable: true })
    expiredAt?: Date;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt!: Date;
}