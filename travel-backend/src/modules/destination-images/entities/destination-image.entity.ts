import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Destination } from 'src/modules/destinations/entities/destination.entity';

@Entity({ name: 'destination_images' })
export class DestinationImage {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: number;

    @Column({ name: 'destination_id', type: 'bigint', unsigned: true })
    destinationId!: number;

    @ManyToOne(() => Destination, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'destination_id' })
    destination!: Destination;

    @Column({ type: 'text' })
    url!: string;

    @Column({ name: 'public_id', type: 'varchar', length: 255 })
    publicId!: string;

    @Column({ name: 'is_default', type: 'boolean', default: false })
    isDefault!: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt?: Date;
}