import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { HotelAmenity } from './entities/hotel-amenity.entity';
import { Hotel } from '../hotels/entities/hotel.entity';
import { Amenity } from '../amenities/entities/amenity.entity';

@Injectable()
export class HotelAmenitiesService {
  constructor(
    @InjectRepository(HotelAmenity)
    private readonly hotelAmenityRepository: Repository<HotelAmenity>,

    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,

    @InjectRepository(Amenity)
    private readonly amenityRepository: Repository<Amenity>,
  ) { }

  private async ensureHotelExists(hotelId: number) {
    const hotel = await this.hotelRepository.findOne({
      where: { id: hotelId },
      select: ['id', 'name'],
    });

    if (!hotel) {
      throw new NotFoundException('Khách sạn không tồn tại');
    }

    return hotel;
  }

  async getByHotel(hotelId: number) {
    await this.ensureHotelExists(hotelId);

    return this.hotelAmenityRepository.find({
      where: { hotelId },
      relations: {
        amenity: true,
      },
      order: {
        amenityId: 'DESC',
      },
    });
  }

  async replaceAmenities(hotelId: number, amenityIds: number[]) {
    await this.ensureHotelExists(hotelId);

    const uniqueIds = [...new Set(amenityIds)];

    if (uniqueIds.length > 0) {
      const amenities = await this.amenityRepository.find({
        where: { id: In(uniqueIds) },
        select: ['id'],
      });

      if (amenities.length !== uniqueIds.length) {
        throw new BadRequestException('Có tiện ích không tồn tại');
      }
    }

    await this.hotelAmenityRepository.delete({ hotelId });

    if (uniqueIds.length === 0) {
      return {
        message: 'Cập nhật tiện ích khách sạn thành công',
        data: [],
      };
    }

    const payload = uniqueIds.map((amenityId) => ({
      hotelId,
      amenityId,
    }));

    await this.hotelAmenityRepository.insert(payload);

    const data = await this.getByHotel(hotelId);

    return {
      message: 'Cập nhật tiện ích khách sạn thành công',
      data,
    };
  }
}