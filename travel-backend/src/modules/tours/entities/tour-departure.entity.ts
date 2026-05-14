import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    Unique,
} from 'typeorm';
import { TourDepartureStatus } from '../tour.enums';
import { Tour } from './tour.entity';
import { DepartureOption } from './departure-option.entity';
import { User } from '../../users/entities/user.entity';

@Entity('tour_departures')
@Unique('uq_tour_departure_code_per_tour', ['tourId', 'code'])
@Index('idx_tour_departures_tour_id', ['tourId'])
@Index('idx_tour_departures_status', ['status'])
@Index('idx_tour_departures_departure_date', ['departureDate'])
export class TourDeparture {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: number;

    @Column({ name: 'tour_id', type: 'bigint', unsigned: true })
    tourId!: number;

    @ManyToOne(() => Tour, (tour) => tour.departures, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tour_id' })
    tour!: Tour;

    @Column({ type: 'varchar', length: 100 })
    code!: string;

    @Column({ name: 'departure_date', type: 'datetime' })
    departureDate!: Date;

    @Column({ name: 'return_date', type: 'datetime' })
    returnDate!: Date;

    @Column({ name: 'registration_deadline', type: 'datetime', nullable: true })
    registrationDeadline?: Date;

    @Column({ type: 'int', unsigned: true, default: 0 })
    capacity!: number;

    @Column({ name: 'booked_slots', type: 'int', unsigned: true, default: 0 })
    bookedSlots!: number;

    @Column({ name: 'base_price_adjustment', type: 'decimal', precision: 15, scale: 2, default: 0 })
    basePriceAdjustment!: string;

    @Column({
        type: 'varchar',
        length: 20,
        default: TourDepartureStatus.DRAFT,
    })
    status!: TourDepartureStatus;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @Column({ name: 'staff_in_charge_id', type: 'bigint', unsigned: true, nullable: true })
    staffInChargeId?: number;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'staff_in_charge_id' })
    staffInChargeUser?: User;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt!: Date;

    @OneToMany(() => DepartureOption, (option) => option.departure)
    options!: DepartureOption[];
}