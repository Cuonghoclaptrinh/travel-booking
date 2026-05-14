import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'amenities' })
export class Amenity {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: number;

    @Column({ type: 'varchar', length: 100, unique: true })
    name!: string;
}