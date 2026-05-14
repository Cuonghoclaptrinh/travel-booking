import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';

import { BaseCrudService } from 'src/common/base/base-crud.service';
import { Amenity } from './entities/amenity.entity';
import { CreateAmenityDto } from './dto/create-amenity.dto';
import { UpdateAmenityDto } from './dto/update-amenity.dto';
import { QueryAmenityDto } from './dto/query-amenity.dto';

@Injectable()
export class AmenitiesService extends BaseCrudService<Amenity> {
  constructor(
    @InjectRepository(Amenity)
    private readonly amenityRepository: Repository<Amenity>,
  ) {
    super(amenityRepository, 'Tiện ích');
  }

  async ensureNameUnique(name: string, excludeId?: number) {
    const existed = await this.amenityRepository.findOne({
      where: { name },
      select: ['id', 'name'],
    });

    if (existed && existed.id !== excludeId) {
      throw new BadRequestException('Tên tiện ích đã tồn tại');
    }
  }

  async createAmenity(dto: CreateAmenityDto) {
    const name = dto.name.trim();

    await this.ensureNameUnique(name);

    return this.create({ name });
  }

  async updateAmenity(id: number, dto: UpdateAmenityDto) {
    const amenity = await this.findOne({ id });

    const nextName = dto.name?.trim() ?? amenity.name;

    await this.ensureNameUnique(nextName, id);

    return this.update(
      { id },
      {
        name: nextName,
      },
    );
  }

  async getPublicList(query: QueryAmenityDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;

    const where = query.search?.trim()
      ? {
        name: ILike(`%${query.search.trim()}%`),
      }
      : undefined;

    return this.getPaging(
      { page, limit },
      {
        where,
        order: { id: 'DESC' },
      },
    );
  }

  async getDetail(id: number) {
    return this.findOne({ id });
  }

  async deleteAmenity(id: number) {
    await this.hardRemove({ id });

    return {
      message: 'Xóa tiện ích thành công',
    };
  }
}