import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tour } from './entities/tour.entity';
import { TourPackage } from './entities/tour-package.entity';
import { CreateTourPackageDto } from './dto/create-tour-package.dto';
import { UpdateTourPackageDto } from './dto/update-tour-package.dto';
import { TourPackageStatus } from './tour.enums';

@Injectable()
export class TourPackagesService {
    constructor(
        @InjectRepository(Tour)
        private readonly tourRepository: Repository<Tour>,

        @InjectRepository(TourPackage)
        private readonly tourPackageRepository: Repository<TourPackage>,
    ) { }

    async getByTourId(tourId: number) {
        await this.ensureTourExists(tourId);

        const items = await this.tourPackageRepository.find({
            where: { tourId },
            order: {
                sortOrder: 'ASC',
                id: 'ASC',
            },
        });

        return items;
    }

    async getById(tourId: number, packageId: number) {
        await this.ensureTourExists(tourId);

        const entity = await this.tourPackageRepository.findOne({
            where: {
                id: packageId,
                tourId,
            },
        });

        if (!entity) {
            throw new NotFoundException('Tour package not found');
        }

        return entity;
    }

    async create(tourId: number, dto: CreateTourPackageDto) {
        await this.ensureTourExists(tourId);

        await this.validateCodeUnique(tourId, dto.code);

        const isFirstPackage =
            (await this.tourPackageRepository.count({
                where: { tourId },
            })) === 0;

        const entity = this.tourPackageRepository.create({
            ...dto,
            tourId,
            status: dto.status ?? TourPackageStatus.ACTIVE,
            allowGuideOption: dto.allowGuideOption ?? false,
            guideExtraPrice: String(dto.guideExtraPrice ?? 0),
            isDefault: dto.isDefault ?? isFirstPackage,
            sortOrder: dto.sortOrder ?? 0,
            priceAdult: String(dto.priceAdult),
            priceChild: String(dto.priceChild),
        });

        if (entity.isDefault) {
            await this.clearDefaultPackages(tourId);
        }

        const created = await this.tourPackageRepository.save(entity);
        return this.getById(tourId, created.id);
    }

    async update(tourId: number, packageId: number, dto: UpdateTourPackageDto) {
        await this.ensureTourExists(tourId);

        const entity = await this.tourPackageRepository.findOne({
            where: {
                id: packageId,
                tourId,
            },
        });

        if (!entity) {
            throw new NotFoundException('Tour package not found');
        }

        if (dto.code && dto.code !== entity.code) {
            await this.validateCodeUnique(tourId, dto.code, packageId);
        }

        if (dto.isDefault === true) {
            await this.clearDefaultPackages(tourId, packageId);
        }

        Object.assign(entity, {
            ...dto,
            priceAdult:
                dto.priceAdult !== undefined ? String(dto.priceAdult) : entity.priceAdult,
            priceChild:
                dto.priceChild !== undefined ? String(dto.priceChild) : entity.priceChild,
            guideExtraPrice:
                dto.guideExtraPrice !== undefined
                    ? String(dto.guideExtraPrice)
                    : entity.guideExtraPrice,
        });

        await this.tourPackageRepository.save(entity);
        return this.getById(tourId, packageId);
    }

    async remove(tourId: number, packageId: number) {
        await this.ensureTourExists(tourId);

        const entity = await this.tourPackageRepository.findOne({
            where: {
                id: packageId,
                tourId,
            },
        });

        if (!entity) {
            throw new NotFoundException('Tour package not found');
        }

        const packageCount = await this.tourPackageRepository.count({
            where: { tourId },
        });

        await this.tourPackageRepository.remove(entity);

        if (entity.isDefault && packageCount > 1) {
            const nextDefault = await this.tourPackageRepository.findOne({
                where: { tourId },
                order: {
                    sortOrder: 'ASC',
                    id: 'ASC',
                },
            });

            if (nextDefault) {
                nextDefault.isDefault = true;
                await this.tourPackageRepository.save(nextDefault);
            }
        }

        return {
            message: 'Tour package deleted successfully',
        };
    }

    async setDefault(tourId: number, packageId: number) {
        await this.ensureTourExists(tourId);

        const entity = await this.tourPackageRepository.findOne({
            where: {
                id: packageId,
                tourId,
            },
        });

        if (!entity) {
            throw new NotFoundException('Tour package not found');
        }

        await this.clearDefaultPackages(tourId, packageId);

        entity.isDefault = true;
        await this.tourPackageRepository.save(entity);

        return this.getById(tourId, packageId);
    }

    private async ensureTourExists(tourId: number) {
        const existed = await this.tourRepository.findOne({
            where: { id: tourId },
            select: ['id'],
        });

        if (!existed) {
            throw new NotFoundException('Tour not found');
        }
    }

    private async validateCodeUnique(
        tourId: number,
        code: string,
        excludeId?: number,
    ) {
        const existed = await this.tourPackageRepository.findOne({
            where: {
                tourId,
                code,
            },
            select: ['id', 'code'],
        });

        if (existed && existed.id !== excludeId) {
            throw new BadRequestException('Package code already exists in this tour');
        }
    }

    private async clearDefaultPackages(tourId: number, excludeId?: number) {
        const packages = await this.tourPackageRepository.find({
            where: { tourId },
        });

        for (const item of packages) {
            if (excludeId && item.id === excludeId) continue;

            if (item.isDefault) {
                item.isDefault = false;
            }
        }

        if (packages.length > 0) {
            await this.tourPackageRepository.save(packages);
        }
    }
}