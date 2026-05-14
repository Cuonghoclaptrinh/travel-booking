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
import { DepartureOptionStatus, TransportType } from '../tour.enums';
import { TourDeparture } from './tour-departure.entity';

@Entity('departure_options')
@Index('idx_departure_options_departure_id', ['departureId'])
@Index('idx_departure_options_status', ['status'])
export class DepartureOption {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: number;

    @Column({ name: 'departure_id', type: 'bigint', unsigned: true })
    departureId!: number;

    @ManyToOne(() => TourDeparture, (departure) => departure.options, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'departure_id' })
    departure!: TourDeparture;

    @Column({ name: 'departure_city', type: 'varchar', length: 150 })
    departureCity!: string;

    @Column({ name: 'transport_type', type: 'varchar', length: 30 })
    transportType!: TransportType;

    @Column({ name: 'extra_price', type: 'decimal', precision: 15, scale: 2, default: 0 })
    extraPrice!: string;

    @Column({ name: 'meeting_point', type: 'varchar', length: 255, nullable: true })
    meetingPoint?: string;

    @Column({ name: 'start_time', type: 'datetime', nullable: true })
    startTime?: Date;

    @Column({ name: 'end_time', type: 'datetime', nullable: true })
    endTime?: Date;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @Column({
        type: 'varchar',
        length: 20,
        default: DepartureOptionStatus.ACTIVE,
    })
    status!: DepartureOptionStatus;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt!: Date;
}