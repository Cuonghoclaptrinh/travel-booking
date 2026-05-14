import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Tour } from './tour.entity';

@Entity('tour_images')
export class TourImage {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: number;

    @Column({ name: 'tour_id', type: 'bigint', unsigned: true })
    tourId!: number;

    @ManyToOne(() => Tour, (tour) => tour.images, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'tour_id' })
    tour!: Tour;

    @Column({ type: 'text' })
    url!: string;

    @Column({
        name: 'public_id',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    publicId?: string;

    @Column({
        name: 'is_default',
        type: 'boolean',
        default: false,
    })
    isDefault!: boolean;

    @Column({
        name: 'sort_order',
        type: 'int',
        default: 0,
    })
    sortOrder!: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
}