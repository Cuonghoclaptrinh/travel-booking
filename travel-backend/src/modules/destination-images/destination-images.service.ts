import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Destination } from '../destinations/entities/destination.entity';
import { DestinationImage } from './entities/destination-image.entity';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';

@Injectable()
export class DestinationImagesService {
  constructor(
    @InjectRepository(DestinationImage)
    private readonly destinationImageRepository: Repository<DestinationImage>,

    @InjectRepository(Destination)
    private readonly destinationRepository: Repository<Destination>,

    private readonly cloudinaryService: CloudinaryService,
  ) { }

  private async ensureDestinationExists(destinationId: number) {
    const destination = await this.destinationRepository.findOne({
      where: { id: destinationId },
      select: ['id', 'name'],
    });

    if (!destination) {
      throw new NotFoundException('Điểm đến không tồn tại');
    }

    return destination;
  }

  async getByDestination(destinationId: number) {
    await this.ensureDestinationExists(destinationId);

    return this.destinationImageRepository.find({
      where: { destinationId },
      order: { isDefault: 'DESC', id: 'DESC' },
    });
  }

  async uploadImage(
    destinationId: number,
    file: Express.Multer.File,
    isDefault = false,
  ) {
    await this.ensureDestinationExists(destinationId);

    const uploaded = await this.cloudinaryService.uploadImage(
      file,
      `destinations/${destinationId}`,
    );

    if (isDefault) {
      await this.destinationImageRepository.update(
        { destinationId },
        { isDefault: false },
      );
    }

    return this.destinationImageRepository.save({
      destinationId,
      url: uploaded.url,
      publicId: uploaded.publicId,
      isDefault,
    });
  }

  async setDefault(imageId: number) {
    const image = await this.destinationImageRepository.findOne({
      where: { id: imageId },
    });

    if (!image) {
      throw new NotFoundException('Ảnh không tồn tại');
    }

    await this.destinationImageRepository.update(
      { destinationId: image.destinationId },
      { isDefault: false },
    );

    await this.destinationImageRepository.update(
      { id: imageId },
      { isDefault: true },
    );

    return { message: 'Đặt ảnh mặc định thành công' };
  }

  async deleteImage(imageId: number) {
    const image = await this.destinationImageRepository.findOne({
      where: { id: imageId },
    });

    if (!image) {
      throw new NotFoundException('Ảnh không tồn tại');
    }

    await this.cloudinaryService.deleteImage(image.publicId);
    await this.destinationImageRepository.remove(image);

    return { message: 'Xóa ảnh thành công' };
  }
}