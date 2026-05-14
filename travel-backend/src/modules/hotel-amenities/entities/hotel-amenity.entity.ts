import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Hotel } from 'src/modules/hotels/entities/hotel.entity';
import { Amenity } from 'src/modules/amenities/entities/amenity.entity';

@Entity({ name: 'hotel_amenities' })
export class HotelAmenity {
    @PrimaryColumn({ name: 'hotel_id', type: 'bigint', unsigned: true })
    hotelId!: number;

    @PrimaryColumn({ name: 'amenity_id', type: 'bigint', unsigned: true })
    amenityId!: number;

    @ManyToOne(() => Hotel, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'hotel_id' })
    hotel!: Hotel;

    @ManyToOne(() => Amenity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'amenity_id' })
    amenity!: Amenity;
}