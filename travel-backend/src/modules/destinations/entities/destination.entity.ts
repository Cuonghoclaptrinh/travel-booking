import { DestinationImage } from 'src/modules/destination-images/entities/destination-image.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DestinationRegion, DestinationType } from '../enums/destination.enum';
@Entity('destinations')
export class Destination {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: number;

    @Column({ length: 150 })
    name!: string;

    @Column({ length: 100, nullable: true })
    country?: string;

    @Column({ length: 180, unique: true })
    slug?: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({
        name: 'region',
        type: 'varchar',
        length: 50,
        nullable: true,
    })
    region?: DestinationRegion;

    @Column({
        name: 'destination_type',
        type: 'varchar',
        length: 50,
        nullable: true,
    })
    destinationType?: DestinationType;

    @Column({
        name: 'is_featured',
        type: 'boolean',
        default: false,
    })
    isFeatured!: boolean;

    @Column({
        name: 'display_order',
        type: 'int',
        default: 0,
    })
    displayOrder!: number;

    @OneToMany(() => DestinationImage, (image) => image.destination)
    images?: DestinationImage[];

    @Column({
        name: 'latitude',
        type: 'decimal',
        precision: 10,
        scale: 7,
        nullable: true,
    })
    latitude?: string | null;

    @Column({
        name: 'longitude',
        type: 'decimal',
        precision: 10,
        scale: 7,
        nullable: true,
    })
    longitude?: string | null;

    @Column({
        name: 'map_address',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    mapAddress?: string | null;

}
