import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Tour } from './entities/tour.entity';
import { TourDeparture } from './entities/tour-departure.entity';
import { TourPackage } from './entities/tour-package.entity';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { QueryTourDto } from './dto/query-tour.dto';
import {
  DepartureOptionStatus,
  TourDepartureStatus,
  TourPackageStatus,
  TourStatus,
} from './tour.enums';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';

@Injectable()
export class ToursService {
  constructor(
    @InjectRepository(Tour)
    private readonly tourRepository: Repository<Tour>,

    @InjectRepository(TourPackage)
    private readonly tourPackageRepository: Repository<TourPackage>,

    @InjectRepository(TourDeparture)
    private readonly tourDepartureRepository: Repository<TourDeparture>,

    private readonly cloudinaryService: CloudinaryService,
  ) { }

  async create(dto: CreateTourDto, file?: Express.Multer.File) {
    const slug = await this.generateUniqueSlug(dto.slug || dto.name);

    let coverImageUrl: string | undefined;
    let imagePublicId: string | undefined;

    if (file) {
      const uploadResult = await this.cloudinaryService.uploadImage(file, 'tours');
      coverImageUrl = uploadResult.url;
      imagePublicId = uploadResult.publicId;
    }

    const entity = this.tourRepository.create({
      ...dto,
      slug,
      coverImageUrl,
      imagePublicId,
      status: TourStatus.DRAFT,
    });

    const created = await this.tourRepository.save(entity);
    return this.findAdminById(created.id);
  }

  async update(id: number, dto: UpdateTourDto, file?: Express.Multer.File) {
    const entity = await this.tourRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException('Tour not found');
    }

    if (dto.slug || dto.name) {
      const nextSlugSource = dto.slug || dto.name || entity.name;
      entity.slug = await this.generateUniqueSlug(nextSlugSource, entity.id);
    }

    if (file) {
      if (entity.imagePublicId) {
        await this.cloudinaryService.deleteImage(entity.imagePublicId);
      }

      const uploadResult = await this.cloudinaryService.uploadImage(file, 'tours');
      entity.coverImageUrl = uploadResult.url;
      entity.imagePublicId = uploadResult.publicId;
    }

    Object.assign(entity, {
      ...dto,
      slug: entity.slug,
      status: entity.status,
    });

    await this.tourRepository.save(entity);
    return this.findAdminById(entity.id);
  }

  async remove(id: number) {
    const entity = await this.tourRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException('Tour not found');
    }

    if (entity.imagePublicId) {
      await this.cloudinaryService.deleteImage(entity.imagePublicId);
    }

    await this.tourRepository.remove(entity);

    return {
      message: 'Tour deleted successfully',
    };
  }

  async findAdminById(id: number) {
    const entity = await this.tourRepository.findOne({
      where: { id },
      relations: {
        packages: true,
        departures: true,
        images: true,
      },
      order: {
        packages: {
          sortOrder: 'ASC',
          id: 'ASC',
        },
        departures: {
          departureDate: 'ASC',
          id: 'ASC',
        },
      },
    });

    if (!entity) {
      throw new NotFoundException('Tour not found');
    }

    return entity;
  }

  async findAdminPaging(query: QueryTourDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.tourRepository
      .createQueryBuilder('tour')
      .orderBy('tour.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (query.search) {
      qb.andWhere('(tour.name LIKE :search OR tour.slug LIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    if (query.destinationId) {
      qb.andWhere('tour.destinationId = :destinationId', {
        destinationId: query.destinationId,
      });
    }

    if (query.status) {
      qb.andWhere('tour.status = :status', {
        status: query.status,
      });
    }

    if (query.isFeatured !== undefined) {
      qb.andWhere('tour.is_featured = :isFeatured', {
        isFeatured: query.isFeatured,
      });
    }

    if (query.isHotDeal !== undefined) {
      qb.andWhere('tour.is_hot_deal = :isHotDeal', {
        isHotDeal: query.isHotDeal,
      });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPublicPaging(query: QueryTourDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.tourRepository
      .createQueryBuilder('tour')
      .where('tour.status = :status', { status: TourStatus.PUBLISHED })
      .orderBy('tour.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (query.search) {
      qb.andWhere('(tour.name LIKE :search OR tour.slug LIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    if (query.destinationId) {
      qb.andWhere('tour.destinationId = :destinationId', {
        destinationId: query.destinationId,
      });
    }
    if (query.priceMin !== undefined || query.priceMax !== undefined) {
      qb.leftJoin(
        'tour.packages',
        'filterPackage',
        'filterPackage.status = :activePackageStatus',
        {
          activePackageStatus: TourPackageStatus.ACTIVE,
        },
      );

      if (query.priceMin !== undefined) {
        qb.andWhere('filterPackage.priceAdult >= :priceMin', {
          priceMin: query.priceMin,
        });
      }

      if (query.priceMax !== undefined) {
        qb.andWhere('filterPackage.priceAdult <= :priceMax', {
          priceMax: query.priceMax,
        });
      }

      qb.distinct(true);
    }

    if (query.durationMin !== undefined) {
      qb.andWhere('tour.durationDays >= :durationMin', {
        durationMin: query.durationMin,
      });
    }

    if (query.durationMax !== undefined) {
      qb.andWhere('tour.durationDays <= :durationMax', {
        durationMax: query.durationMax,
      });
    }

    if (query.departureFrom || query.departureTo) {
      qb.leftJoin(
        'tour.departures',
        'filterDeparture',
        'filterDeparture.status IN (:...departureStatuses)',
        {
          departureStatuses: [
            TourDepartureStatus.OPEN,
            TourDepartureStatus.FULL,
          ],
        },
      );

      if (query.departureFrom) {
        qb.andWhere('filterDeparture.departureDate >= :departureFrom', {
          departureFrom: query.departureFrom,
        });
      }

      if (query.departureTo) {
        qb.andWhere('filterDeparture.departureDate <= :departureTo', {
          departureTo: query.departureTo,
        });
      }

      qb.distinct(true);
    }

    if (query.tourType) {
      qb.andWhere('tour.tourType = :tourType', {
        tourType: query.tourType,
      });
    }

    if (query.feature) {
      qb.andWhere('tour.featureTags LIKE :feature', {
        feature: `%${query.feature}%`,
      });
    }

    if (query.isFeatured !== undefined) {
      qb.andWhere('tour.is_featured = :isFeatured', {
        isFeatured: query.isFeatured,
      });
    }

    if (query.isHotDeal !== undefined) {
      qb.andWhere('tour.is_hot_deal = :isHotDeal', {
        isHotDeal: query.isHotDeal,
      });
    }

    const [items, total] = await qb.getManyAndCount();

    const mappedItems = await Promise.all(
      items.map(async (tour) => {
        const [
          activePackageCount,
          openDepartureCount,
          activePackages,
          upcomingDepartures,
          tourWithImages,
        ] = await Promise.all([
          this.tourPackageRepository.count({
            where: {
              tourId: tour.id,
              status: TourPackageStatus.ACTIVE,
            },
          }),

          this.tourDepartureRepository.count({
            where: {
              tourId: tour.id,
              status: TourDepartureStatus.OPEN,
            },
          }),

          this.tourPackageRepository.find({
            where: {
              tourId: tour.id,
              status: TourPackageStatus.ACTIVE,
            },
            order: {
              sortOrder: 'ASC',
              id: 'ASC',
            },
          }),

          this.tourDepartureRepository.find({
            where: [
              {
                tourId: tour.id,
                status: TourDepartureStatus.OPEN,
              },
              {
                tourId: tour.id,
                status: TourDepartureStatus.FULL,
              },
            ],
            order: {
              departureDate: 'ASC',
              id: 'ASC',
            },
            take: 8,
          }),
          this.tourRepository.findOne({
            where: { id: tour.id },
            relations: {
              images: true,
            },
            order: {
              images: {
                sortOrder: 'ASC',
                id: 'ASC',
              },
            },
          }),
        ]);

        const defaultPackage = activePackages.find((x) => x.isDefault);

        const lowestPackage = [...activePackages].sort(
          (a, b) => Number(a.priceAdult) - Number(b.priceAdult),
        )[0];

        const displayPackage = defaultPackage ?? lowestPackage;

        const priceInfo = this.getTourDisplayPrice({
          ...tour,
          packages: activePackages,
        });

        return {
          ...tour,
          images: tourWithImages?.images || [],
          activePackageCount,
          openDepartureCount,

          priceFrom: displayPackage?.priceAdult ?? null,
          priceChildFrom: displayPackage?.priceChild ?? null,
          defaultPackageName: displayPackage?.name ?? null,

          ...priceInfo,

          upcomingDepartures: upcomingDepartures.map((departure) => ({
            ...departure,
            availableSlots: Math.max(
              0,
              Number(departure.capacity) - Number(departure.bookedSlots),
            ),
          })),
        };
      }),
    );

    return {
      items: mappedItems,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPublicBySlug(slug: string) {
    const entity = await this.tourRepository.findOne({
      where: {
        slug,
        status: TourStatus.PUBLISHED,
      },
      relations: {
        destination: true,
        packages: true,
        departures: {
          options: true,
        },
        images: true,

      },
      order: {
        packages: {
          sortOrder: 'ASC',
          id: 'ASC',
        },
        departures: {
          departureDate: 'ASC',
          id: 'ASC',
        },
        images: {
          sortOrder: 'ASC',
          id: 'ASC',
        },
      },
    });

    if (!entity) {
      throw new NotFoundException('Tour not found');
    }

    const activePackages = (entity.packages || []).filter(
      (x) => x.status === TourPackageStatus.ACTIVE,
    );

    const activeDepartures = (entity.departures || [])
      .filter(
        (x) =>
          x.status === TourDepartureStatus.OPEN ||
          x.status === TourDepartureStatus.FULL,
      )
      .map((departure) => ({
        ...departure,
        availableSlots: Math.max(0, departure.capacity - departure.bookedSlots),
        options: (departure.options || []).filter(
          (o) => o.status === DepartureOptionStatus.ACTIVE,
        ),
      }));

    return {
      ...entity,
      packages: activePackages,
      departures: activeDepartures,
      images: entity.images || [],
    };
  }

  async publish(id: number) {
    const entity = await this.tourRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException('Tour not found');
    }

    const activePackageCount = await this.tourPackageRepository.count({
      where: {
        tourId: id,
        status: TourPackageStatus.ACTIVE,
      },
    });

    if (activePackageCount === 0) {
      throw new BadRequestException(
        'Cannot publish tour without at least one active package',
      );
    }

    entity.status = TourStatus.PUBLISHED;
    await this.tourRepository.save(entity);

    return this.findAdminById(entity.id);
  }

  async close(id: number) {
    const entity = await this.tourRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException('Tour not found');
    }

    entity.status = TourStatus.CLOSED;
    await this.tourRepository.save(entity);

    return this.findAdminById(entity.id);
  }

  private async generateUniqueSlug(input: string, excludeId?: number) {
    const baseSlug = this.slugify(input);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const where: FindOptionsWhere<Tour> = { slug };

      const existed = await this.tourRepository.findOne({
        where,
        select: ['id', 'slug'],
      });

      if (!existed) {
        return slug;
      }

      if (excludeId && existed.id === excludeId) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  private slugify(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private calculateSalePrice(price: string | number, discountPercent?: number) {
    const originalPrice = Number(price || 0);
    const discount = Number(discountPercent || 0);

    if (!originalPrice || discount <= 0) {
      return originalPrice;
    }

    return Math.round((originalPrice * (100 - discount)) / 100);
  }

  private getTourDisplayPrice(tour: Tour & { packages?: TourPackage[] }) {
    const packages = tour.packages || [];

    if (packages.length === 0) {
      return {
        minOriginalPrice: null,
        minSalePrice: null,
        discountPercent: 0,
      };
    }

    const activePackages = packages.filter(
      (pkg) => pkg.status === TourPackageStatus.ACTIVE,
    );

    const packageList = activePackages.length > 0 ? activePackages : packages;

    const mappedPrices = packageList
      .map((pkg) => {
        const originalPrice = Number(pkg.priceAdult || 0);
        const discountPercent = Number(pkg.discountPercent || 0);
        const salePrice = this.calculateSalePrice(originalPrice, discountPercent);

        return {
          originalPrice,
          salePrice,
          discountPercent,
        };
      })
      .filter((item) => item.originalPrice > 0);

    if (mappedPrices.length === 0) {
      return {
        minOriginalPrice: null,
        minSalePrice: null,
        discountPercent: 0,
      };
    }

    mappedPrices.sort((a, b) => a.salePrice - b.salePrice);

    return {
      minOriginalPrice: mappedPrices[0].originalPrice,
      minSalePrice: mappedPrices[0].salePrice,
      discountPercent: mappedPrices[0].discountPercent,
    };
  }
}
