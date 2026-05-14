import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Hotel } from '../hotels/entities/hotel.entity';
import { HotelImage } from './entities/hotel-image.entity';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';

@Injectable()
export class HotelImagesService {
  constructor(
    @InjectRepository(HotelImage)
    private readonly hotelImageRepository: Repository<HotelImage>,

    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,

    private readonly cloudinaryService: CloudinaryService,
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

    return this.hotelImageRepository.find({
      where: { hotelId },
      order: { isDefault: 'DESC', id: 'DESC' },
    });
  }

  async uploadImage(
    hotelId: number,
    file: Express.Multer.File,
    isDefault = false,
  ) {
    await this.ensureHotelExists(hotelId);

    const uploaded = await this.cloudinaryService.uploadImage(
      file,
      `hotels/${hotelId}`,
    );

    if (isDefault) {
      await this.hotelImageRepository.update({ hotelId }, { isDefault: false });
    }

    return this.hotelImageRepository.save({
      hotelId,
      url: uploaded.url,
      publicId: uploaded.publicId,
      isDefault,
    });
  }

  async setDefault(imageId: number) {
    const image = await this.hotelImageRepository.findOne({
      where: { id: imageId },
    });

    if (!image) {
      throw new NotFoundException('Ảnh không tồn tại');
    }

    await this.hotelImageRepository.update(
      { hotelId: image.hotelId },
      { isDefault: false },
    );

    await this.hotelImageRepository.update(
      { id: imageId },
      { isDefault: true },
    );

    return { message: 'Đặt ảnh mặc định thành công' };
  }

  async deleteImage(imageId: number) {
    const image = await this.hotelImageRepository.findOne({
      where: { id: imageId },
    });

    if (!image) {
      throw new NotFoundException('Ảnh không tồn tại');
    }

    await this.cloudinaryService.deleteImage(image.publicId);
    await this.hotelImageRepository.remove(image);

    return { message: 'Xóa ảnh thành công' };
  }
}