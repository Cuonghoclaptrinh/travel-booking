import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseCrudService } from 'src/common/base/base-crud.service';
import { RoomType } from './entities/room-type.entity';
import { Hotel } from '../hotels/entities/hotel.entity';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
import { QueryRoomTypeDto } from './dto/query-room-type.dto';

@Injectable()
export class RoomTypesService extends BaseCrudService<RoomType> {
  constructor(
    @InjectRepository(RoomType)
    private readonly roomTypeRepository: Repository<RoomType>,

    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,
  ) {
    super(roomTypeRepository, 'Loại phòng');
  }

  private async ensureHotelExists(hotelId: number) {
    const hotel = await this.hotelRepository.findOne({
      where: { id: hotelId },
      select: ['id', 'name'],
    });

    if (!hotel) {
      throw new BadRequestException('Khách sạn không tồn tại');
    }

    return hotel;
  }

  async createRoomType(hotelId: number, dto: CreateRoomTypeDto) {
    await this.ensureHotelExists(hotelId);

    return this.create({
      hotelId,
      name: dto.name.trim(),
      maxAdults: dto.maxAdults ?? 1,
      maxChildren: dto.maxChildren ?? 0,
      basePricePerNight: dto.basePricePerNight.toFixed(2),
    });
  }

  async updateRoomType(id: number, dto: UpdateRoomTypeDto) {
    const roomType = await this.findOne({ id });

    return this.update(
      { id },
      {
        name: dto.name?.trim() ?? roomType.name,
        maxAdults: dto.maxAdults ?? roomType.maxAdults,
        maxChildren: dto.maxChildren ?? roomType.maxChildren,
        basePricePerNight:
          dto.basePricePerNight !== undefined
            ? dto.basePricePerNight.toFixed(2)
            : roomType.basePricePerNight,
      },
    );
  }

  async getByHotel(hotelId: number, query: QueryRoomTypeDto) {
    await this.ensureHotelExists(hotelId);

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const sortMap: Record<string, string> = {
      id: 'roomType.id',
      name: 'roomType.name',
      basePricePerNight: 'roomType.basePricePerNight',
      createdAt: 'roomType.createdAt',
    };

    const sortBy = sortMap[query.sortBy || 'id'] || 'roomType.id';
    const sortOrder = (query.sortOrder || 'DESC').toUpperCase() as 'ASC' | 'DESC';

    const qb = this.roomTypeRepository
      .createQueryBuilder('roomType')
      .leftJoinAndSelect('roomType.hotel', 'hotel')
      .where('roomType.hotelId = :hotelId', { hotelId })
      .orderBy(sortBy, sortOrder)
      .skip(skip)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDetail(id: number) {
    return this.findOne(
      { id },
      {
        relations: {
          hotel: true,
        },
      },
    );
  }

  async deleteRoomType(id: number) {
    await this.hardRemove({ id });

    return {
      message: 'Xóa loại phòng thành công',
    };
  }
}