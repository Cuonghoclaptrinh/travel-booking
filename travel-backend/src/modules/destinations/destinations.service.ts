import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';

import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';
import { QueryDestinationDto } from './dto/query-destination.dto';
import { Destination } from './entities/destination.entity';
import { BaseCrudService } from 'src/common/base/base-crud.service';

@Injectable()
export class DestinationsService extends BaseCrudService<Destination> {
  constructor(
    @InjectRepository(Destination)
    private readonly destinationRepository: Repository<Destination>,
  ) {
    super(destinationRepository, 'Điểm đến');
  }

  private slugify(text: string) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private normalizeMapFields(dto: {
    latitude?: number | string | null;
    longitude?: number | string | null;
    mapAddress?: string | null;
  }) {
    return {
      latitude:
        dto.latitude === undefined || dto.latitude === null || dto.latitude === ''
          ? null
          : String(dto.latitude),

      longitude:
        dto.longitude === undefined || dto.longitude === null || dto.longitude === ''
          ? null
          : String(dto.longitude),

      mapAddress: dto.mapAddress?.trim() || null,
    };
  }

  async createDestination(dto: CreateDestinationDto) {
    const slug = dto.slug?.trim()
      ? this.slugify(dto.slug.trim())
      : this.slugify(dto.name);

    const existed = await this.destinationRepository.findOne({
      where: { slug },
    });

    if (existed) {
      throw new BadRequestException('Slug đã tồn tại');
    }

    const {
      latitude,
      longitude,
      mapAddress,
      ...restDto
    } = dto;

    const mapFields = this.normalizeMapFields({
      latitude,
      longitude,
      mapAddress,
    });

    return this.create({
      ...restDto,
      ...mapFields,
      slug,
      country: dto.country || 'Việt Nam',
      isFeatured: dto.isFeatured ?? false,
      displayOrder: dto.displayOrder ?? 0,
    });
  }

  async updateDestination(id: number, dto: UpdateDestinationDto) {
    const destination = await this.findOne({ id });

    let nextSlug = destination.slug ?? '';

    if (dto.slug?.trim()) {
      nextSlug = this.slugify(dto.slug.trim());
    } else if (dto.name && dto.name !== destination.name) {
      nextSlug = this.slugify(dto.name);
    }

    const existed = await this.destinationRepository.findOne({
      where: { slug: nextSlug },
    });

    if (existed && Number(existed.id) !== id) {
      throw new BadRequestException('Slug đã tồn tại');
    }

    const {
      latitude,
      longitude,
      mapAddress,
      ...restDto
    } = dto;

    const payload: Partial<Destination> = {
      ...restDto,
      slug: nextSlug,
    };

    if (
      latitude !== undefined ||
      longitude !== undefined ||
      mapAddress !== undefined
    ) {
      Object.assign(
        payload,
        this.normalizeMapFields({
          latitude,
          longitude,
          mapAddress,
        }),
      );
    }

    return this.update({ id }, payload);
  }

  async getPublicList(query: QueryDestinationDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const qb = this.destinationRepository
      .createQueryBuilder('destination')
      .leftJoin(
        'destination.images',
        'defaultImage',
        'defaultImage.isDefault = :isDefault',
        { isDefault: true },
      )
      .addSelect('defaultImage.url', 'defaultImageUrl')
      .where('1 = 1');

    if (query.search?.trim()) {
      const search = query.search.trim();

      qb.andWhere(
        new Brackets((subQb) => {
          subQb
            .where('destination.name LIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('destination.country LIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('destination.description LIKE :search', {
              search: `%${search}%`,
            });
        }),
      );
    }

    if (query.region) {
      qb.andWhere('destination.region = :region', {
        region: query.region,
      });
    }

    if (query.destinationType) {
      qb.andWhere('destination.destinationType = :destinationType', {
        destinationType: query.destinationType,
      });
    }

    if (query.isFeatured !== undefined) {
      qb.andWhere('destination.isFeatured = :isFeatured', {
        isFeatured: query.isFeatured,
      });
    }

    qb.orderBy('destination.displayOrder', 'ASC')
      .addOrderBy('destination.id', 'DESC')
      .skip(skip)
      .take(limit);

    const { entities, raw } = await qb.getRawAndEntities();
    const total = await qb.getCount();

    const data = entities.map((destination, index) => ({
      ...destination,
      defaultImageUrl: raw[index]?.defaultImageUrl ?? null,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPublicDetail(id: number) {
    const destination = await this.destinationRepository.findOne({
      where: { id },
      relations: {
        images: true,
      },
      order: {
        images: {
          isDefault: 'DESC',
          id: 'DESC',
        },
      },
    });

    if (!destination) {
      throw new NotFoundException('Điểm đến không tồn tại');
    }

    return destination;
  }

  async deleteDestination(id: number) {
    await this.hardRemove({ id });

    return {
      message: 'Xóa điểm đến thành công',
    };
  }
}