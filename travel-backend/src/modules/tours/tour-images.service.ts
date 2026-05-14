import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TourImage } from './entities/tour-image.entity';
import { Tour } from './entities/tour.entity';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';

@Injectable()
export class TourImagesService {
    constructor(
        @InjectRepository(TourImage)
        private readonly tourImageRepository: Repository<TourImage>,

        @InjectRepository(Tour)
        private readonly tourRepository: Repository<Tour>,

        private readonly cloudinaryService: CloudinaryService,
    ) { }

    async getByTourId(tourId: number) {
        return this.tourImageRepository.find({
            where: { tourId },
            order: {
                sortOrder: 'ASC',
                id: 'ASC',
            },
        });
    }

    async uploadMany(tourId: number, files: Express.Multer.File[]) {
        const tour = await this.tourRepository.findOne({
            where: { id: tourId },
        });

        if (!tour) {
            throw new NotFoundException('Tour not found');
        }

        if (!files || files.length === 0) {
            return this.getByTourId(tourId);
        }

        const currentCount = await this.tourImageRepository.count({
            where: { tourId },
        });

        const uploadedImages: TourImage[] = [];

        for (let i = 0; i < files.length; i += 1) {
            const file = files[i];

            /**
             * Bạn sửa đoạn này theo CloudinaryService thật của bạn.
             * Ví dụ service của bạn có thể tên là uploadImage(file) hoặc uploadFile(file).
             */
            const uploaded = await this.cloudinaryService.uploadImage(
                file,
                'tours/gallery',
            );

            const image = this.tourImageRepository.create({
                tourId,
                url: uploaded.url,
                publicId: uploaded.publicId,
                sortOrder: currentCount + i + 1,
                isDefault: currentCount === 0 && i === 0,
            });

            uploadedImages.push(await this.tourImageRepository.save(image));
        }

        return uploadedImages;
    }

    async setDefault(tourId: number, imageId: number) {
        const image = await this.tourImageRepository.findOne({
            where: {
                id: imageId,
                tourId,
            },
        });

        if (!image) {
            throw new NotFoundException('Tour image not found');
        }

        await this.tourImageRepository.update(
            { tourId },
            { isDefault: false },
        );

        image.isDefault = true;

        return this.tourImageRepository.save(image);
    }

    async remove(tourId: number, imageId: number) {
        const image = await this.tourImageRepository.findOne({
            where: {
                id: imageId,
                tourId,
            },
        });

        if (!image) {
            throw new NotFoundException('Tour image not found');
        }

        if (image.publicId) {
            await this.cloudinaryService.deleteImage(image.publicId);
        }

        await this.tourImageRepository.delete(image.id);

        return {
            message: 'Deleted successfully',
        };
    }
}