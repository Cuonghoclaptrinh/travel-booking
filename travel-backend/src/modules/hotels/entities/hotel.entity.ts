import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Destination } from 'src/modules/destinations/entities/destination.entity';

@Entity({ name: 'hotels' })
export class Hotel {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: number;

    @Column({ name: 'destination_id', type: 'bigint', unsigned: true })
    destinationId!: number;

    @ManyToOne(() => Destination, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'destination_id' })
    destination!: Destination;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ type: 'text', nullable: true })
    address!: string | null;

    @Column({ name: 'star_rating', type: 'decimal', precision: 2, scale: 1, nullable: true })
    starRating?: string | null;

    @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
    latitude!: string | null;

    @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
    longitude!: string | null;

    @Column({ name: 'contact_phone', type: 'varchar', length: 20, nullable: true })
    contactPhone!: string | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt!: Date;
}