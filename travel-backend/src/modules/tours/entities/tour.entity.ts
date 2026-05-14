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
} from 'typeorm';
import { TourStatus } from '../tour.enums';
import { TourPackage } from './tour-package.entity';
import { TourDeparture } from './tour-departure.entity';
import { TourImage } from './tour-image.entity';
import { Destination } from 'src/modules/destinations/entities/destination.entity';

@Entity('tours')
@Index('idx_tours_destination_id', ['destinationId'])
@Index('idx_tours_status', ['status'])
@Index('idx_tours_slug', ['slug'], { unique: true })
export class Tour {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: number;

    @Column({ name: 'destination_id', type: 'bigint', unsigned: true })
    destinationId!: number;

    @ManyToOne(() => Destination, { nullable: false })
    @JoinColumn({ name: 'destination_id' })
    destination!: Destination;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    slug!: string;

    @Column({ name: 'short_description', type: 'varchar', length: 500, nullable: true })
    shortDescription?: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ name: 'duration_days', type: 'int', unsigned: true, default: 1 })
    durationDays!: number;

    @Column({ name: 'duration_nights', type: 'int', unsigned: true, default: 0 })
    durationNights!: number;

    @Column({ name: 'cover_image_url', type: 'varchar', length: 1024, nullable: true })
    coverImageUrl?: string;

    @Column({ nullable: true })
    imagePublicId?: string;

    @Column({ type: 'text', nullable: true })
    highlights?: string;

    @Column({ name: 'included_services', type: 'text', nullable: true })
    includedServices?: string;

    @Column({ name: 'excluded_services', type: 'text', nullable: true })
    excludedServices?: string;

    @Column({ name: 'terms_and_conditions', type: 'text', nullable: true })
    termsAndConditions?: string;

    @Column({
        type: 'varchar',
        length: 20,
        default: TourStatus.DRAFT,
    })
    status!: TourStatus;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt!: Date;

    @OneToMany(() => TourPackage, (tourPackage) => tourPackage.tour)
    packages!: TourPackage[];

    @OneToMany(() => TourDeparture, (tourDeparture) => tourDeparture.tour)
    departures!: TourDeparture[];

    @Column({
        name: 'tour_type',
        type: 'varchar',
        length: 50,
        nullable: true,
    })
    tourType?: string;

    @Column({
        name: 'feature_tags',
        type: 'simple-array',
        nullable: true,
    })
    featureTags?: string[];

    @OneToMany(() => TourImage, (image) => image.tour)
    images!: TourImage[];

    @Column({
        name: 'is_featured',
        type: 'tinyint',
        width: 1,
        default: 0,
    })
    isFeatured!: boolean;

    @Column({
        name: 'is_hot_deal',
        type: 'tinyint',
        width: 1,
        default: 0,
    })
    isHotDeal!: boolean;
}