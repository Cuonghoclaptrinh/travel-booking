import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Hotel } from 'src/modules/hotels/entities/hotel.entity';

@Entity({ name: 'room_types' })
export class RoomType {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id: number;

    @Column({ name: 'hotel_id', type: 'bigint', unsigned: true })
    hotelId: number;

    @ManyToOne(() => Hotel, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'hotel_id' })
    hotel: Hotel;

    @Column({ type: 'varchar', length: 150 })
    name: string;

    @Column({ name: 'max_adults', type: 'int', unsigned: true, default: 1 })
    maxAdults: number;

    @Column({ name: 'max_children', type: 'int', unsigned: true, default: 0 })
    maxChildren: number;

    @Column({
        name: 'base_price_per_night',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
    })
    basePricePerNight: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;
}