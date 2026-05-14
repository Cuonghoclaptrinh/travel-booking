import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn,
} from 'typeorm';
import { TourPackageStatus } from '../tour.enums';
import { Tour } from './tour.entity';

@Entity('tour_packages')
@Unique('uq_tour_package_code_per_tour', ['tourId', 'code'])
@Index('idx_tour_packages_tour_id', ['tourId'])
@Index('idx_tour_packages_status', ['status'])
export class TourPackage {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: number;

    @Column({ name: 'tour_id', type: 'bigint', unsigned: true })
    tourId!: number;

    @ManyToOne(() => Tour, (tour) => tour.packages, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tour_id' })
    tour!: Tour;

    @Column({ type: 'varchar', length: 100 })
    name!: string;

    @Column({ type: 'varchar', length: 50 })
    code!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ name: 'price_adult', type: 'decimal', precision: 15, scale: 2, default: 0 })
    priceAdult!: string;

    @Column({ name: 'price_child', type: 'decimal', precision: 15, scale: 2, default: 0 })
    priceChild!: string;

    @Column({ name: 'hotel_name', type: 'varchar', length: 255, nullable: true })
    hotelName?: string;

    @Column({ name: 'hotel_standard', type: 'varchar', length: 50, nullable: true })
    hotelStandard?: string;

    @Column({ name: 'hotel_address', type: 'varchar', length: 500, nullable: true })
    hotelAddress?: string;

    @Column({ name: 'hotel_description', type: 'text', nullable: true })
    hotelDescription?: string;

    @Column({ name: 'room_type', type: 'varchar', length: 100, nullable: true })
    roomType?: string;

    @Column({ name: 'meals_included', type: 'varchar', length: 255, nullable: true })
    mealsIncluded?: string;

    @Column({ name: 'allow_guide_option', type: 'boolean', default: false })
    allowGuideOption!: boolean;

    @Column({ name: 'guide_extra_price', type: 'decimal', precision: 15, scale: 2, default: 0 })
    guideExtraPrice!: string;

    @Column({ name: 'is_default', type: 'boolean', default: false })
    isDefault!: boolean;

    @Column({ name: 'sort_order', type: 'int', default: 0 })
    sortOrder!: number;

    @Column({
        type: 'varchar',
        length: 20,
        default: TourPackageStatus.ACTIVE,
    })
    status!: TourPackageStatus;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt!: Date;

    @Column({ name: 'discount_percent', type: 'int', unsigned: true, default: 0, })
    discountPercent!: number;
}