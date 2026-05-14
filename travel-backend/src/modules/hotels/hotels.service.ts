import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseCrudService } from 'src/common/base/base-crud.service';
import { Hotel } from './entities/hotel.entity';
import { Destination } from '../destinations/entities/destination.entity';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { QueryHotelDto } from './dto/query-hotel.dto';

@Injectable()
export class HotelsService extends BaseCrudService<Hotel> {
  constructor(
    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,

    @InjectRepository(Destination)
    private readonly destinationRepository: Repository<Destination>,
  ) {
    super(hotelRepository, 'Khách sạn');
  }

  private async ensureDestinationExists(destinationId: number) {
    const destination = await this.destinationRepository.findOne({
      where: { id: destinationId },
      select: ['id', 'name'],
    });

    if (!destination) {
      throw new BadRequestException('Điểm đến không tồn tại');
    }

    return destination;
  }

  async createHotel(dto: CreateHotelDto) {
    await this.ensureDestinationExists(dto.destinationId);

    return this.create({
      destinationId: dto.destinationId,
      name: dto.name.trim(),
      address: dto.address?.trim() || null,
      starRating:
        dto.starRating !== undefined ? dto.starRating.toFixed(1) : null,
      latitude:
        dto.latitude !== undefined ? dto.latitude.toFixed(8) : null,
      longitude:
        dto.longitude !== undefined ? dto.longitude.toFixed(8) : null,
      contactPhone: dto.contactPhone?.trim() || null,
    });
  }

  async updateHotel(id: number, dto: UpdateHotelDto) {
    const hotel = await this.findOne({ id });

    if (
      dto.destinationId !== undefined &&
      dto.destinationId !== hotel.destinationId
    ) {
      await this.ensureDestinationExists(dto.destinationId);
    }

    return this.update(
      { id },
      {
        destinationId: dto.destinationId ?? hotel.destinationId,
        name: dto.name?.trim() ?? hotel.name,
        address:
          dto.address !== undefined ? dto.address?.trim() || null : hotel.address,
        starRating:
          dto.starRating !== undefined
            ? dto.starRating.toFixed(1)
            : hotel.starRating,
        latitude:
          dto.latitude !== undefined
            ? dto.latitude.toFixed(8)
            : hotel.latitude,
        longitude:
          dto.longitude !== undefined
            ? dto.longitude.toFixed(8)
            : hotel.longitude,
        contactPhone:
          dto.contactPhone !== undefined
            ? dto.contactPhone?.trim() || null
            : hotel.contactPhone,
      },
    );
  }

  async getPublicList(query: QueryHotelDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const qb = this.hotelRepository
      .createQueryBuilder('hotel')
      .leftJoinAndSelect('hotel.destination', 'destination');

    if (query.search?.trim()) {
      const keyword = `%${query.search.trim()}%`;
      qb.andWhere(
        `
        (
          hotel.name LIKE :keyword
          OR hotel.address LIKE :keyword
          OR destination.name LIKE :keyword
        )
        `,
        { keyword },
      );
    }

    if (query.destinationId) {
      qb.andWhere('hotel.destinationId = :destinationId', {
        destinationId: query.destinationId,
      });
    }

    if (query.starRating !== undefined) {
      qb.andWhere('hotel.starRating = :starRating', {
        starRating: query.starRating.toFixed(1),
      });
    }

    const sortMap: Record<string, string> = {
      id: 'hotel.id',
      name: 'hotel.name',
      starRating: 'hotel.starRating',
      createdAt: 'hotel.createdAt',
    };

    const sortBy = sortMap[query.sortBy || 'id'] || 'hotel.id';
    const sortOrder = (query.sortOrder || 'DESC').toUpperCase() as 'ASC' | 'DESC';

    qb.orderBy(sortBy, sortOrder).skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPublicDetail(id: number) {
    return this.findOne(
      { id },
      {
        relations: {
          destination: true,
        },
      },
    );
  }

  async getByDestination(destinationId: number, query: QueryHotelDto) {
    await this.ensureDestinationExists(destinationId);

    return this.getPublicList({
      ...query,
      destinationId,
    });
  }

  async deleteHotel(id: number) {
    await this.hardRemove({ id });

    return {
      message: 'Xóa khách sạn thành công',
    };
  }
}