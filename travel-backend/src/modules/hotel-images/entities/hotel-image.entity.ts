import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Hotel } from 'src/modules/hotels/entities/hotel.entity';

@Entity({ name: 'hotel_images' })
export class HotelImage {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: number;

    @Column({ name: 'hotel_id', type: 'bigint', unsigned: true })
    hotelId!: number;

    @ManyToOne(() => Hotel, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'hotel_id' })
    hotel!: Hotel;

    @Column({ type: 'text' })
    url!: string;

    @Column({ name: 'public_id', type: 'varchar', length: 255 })
    publicId!: string;

    @Column({ name: 'is_default', type: 'boolean', default: false })
    isDefault!: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;
}