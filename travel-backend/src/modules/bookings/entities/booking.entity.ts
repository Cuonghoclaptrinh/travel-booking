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
import { User } from 'src/modules/users/entities/user.entity';
import { Tour } from 'src/modules/tours/entities/tour.entity';
import { TourPackage } from 'src/modules/tours/entities/tour-package.entity';
import { TourDeparture } from 'src/modules/tours/entities/tour-departure.entity';
import { DepartureOption } from 'src/modules/tours/entities/departure-option.entity';
import { BookingStatus, PaymentMethod, PaymentStatus } from '../booking.enums';

@Entity('bookings')
@Index('idx_bookings_user_id', ['userId'])
@Index('idx_bookings_departure_id', ['departureId'])
@Index('idx_bookings_status', ['bookingStatus'])
@Index('idx_bookings_payment_status', ['paymentStatus'])
@Index('idx_bookings_expires_at', ['expiresAt'])
@Index('idx_bookings_code', ['code'], { unique: true })
export class Booking {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: number;

    @Column({ type: 'varchar', length: 50, unique: true })
    code!: string;

    @Column({ name: 'user_id', type: 'bigint', unsigned: true })
    userId!: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @Column({ name: 'tour_id', type: 'bigint', unsigned: true })
    tourId!: number;

    @ManyToOne(() => Tour, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'tour_id' })
    tour!: Tour;

    @Column({ name: 'package_id', type: 'bigint', unsigned: true })
    packageId!: number;

    @ManyToOne(() => TourPackage, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'package_id' })
    tourPackage!: TourPackage;

    @Column({ name: 'departure_id', type: 'bigint', unsigned: true })
    departureId!: number;

    @ManyToOne(() => TourDeparture, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'departure_id' })
    departure!: TourDeparture;

    @Column({ name: 'option_id', type: 'bigint', unsigned: true })
    optionId!: number;

    @ManyToOne(() => DepartureOption, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'option_id' })
    departureOption!: DepartureOption;

    @Column({ name: 'contact_name', type: 'varchar', length: 255 })
    contactName!: string;

    @Column({ name: 'contact_email', type: 'varchar', length: 255 })
    contactEmail!: string;

    @Column({ name: 'contact_phone', type: 'varchar', length: 30, nullable: true })
    contactPhone?: string;

    @Column({ name: 'adult_count', type: 'int', unsigned: true, default: 1 })
    adultCount!: number;

    @Column({ name: 'child_count', type: 'int', unsigned: true, default: 0 })
    childCount!: number;

    @Column({ name: 'reserved_slots', type: 'int', unsigned: true, default: 1 })
    reservedSlots!: number;

    @Column({ name: 'is_private_guide', type: 'boolean', default: false })
    isPrivateGuide!: boolean;

    @Column({ name: 'unit_price_adult', type: 'decimal', precision: 15, scale: 2, default: 0 })
    unitPriceAdult!: string;

    @Column({ name: 'unit_price_child', type: 'decimal', precision: 15, scale: 2, default: 0 })
    unitPriceChild!: string;

    @Column({ name: 'departure_price_adjustment', type: 'decimal', precision: 15, scale: 2, default: 0 })
    departurePriceAdjustment!: string;

    @Column({ name: 'option_extra_price', type: 'decimal', precision: 15, scale: 2, default: 0 })
    optionExtraPrice!: string;

    @Column({ name: 'guide_extra_price', type: 'decimal', precision: 15, scale: 2, default: 0 })
    guideExtraPrice!: string;

    @Column({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
    totalAmount!: string;

    @Column({
        name: 'booking_status',
        type: 'varchar',
        length: 30,
        default: BookingStatus.PENDING_PAYMENT,
    })
    bookingStatus!: BookingStatus;

    @Column({
        name: 'payment_status',
        type: 'varchar',
        length: 20,
        default: PaymentStatus.UNPAID,
    })
    paymentStatus!: PaymentStatus;

    @Column({
        name: 'payment_method',
        type: 'varchar',
        length: 30,
        nullable: true,
    })
    paymentMethod?: PaymentMethod;

    @Column({ name: 'payment_reference', type: 'varchar', length: 100, nullable: true })
    paymentReference?: string;

    @Column({ name: 'expires_at', type: 'datetime' })
    expiresAt!: Date;

    @Column({ name: 'paid_at', type: 'datetime', nullable: true })
    paidAt?: Date;

    @Column({ name: 'cancelled_at', type: 'datetime', nullable: true })
    cancelledAt?: Date;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt!: Date;
}

export { BookingStatus, PaymentStatus };
