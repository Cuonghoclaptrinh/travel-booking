import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
    constructor(private readonly configService: ConfigService) {
        cloudinary.config({
            cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
            api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
            api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
        });
    }

    async uploadImage(
        file: Express.Multer.File,
        folder: string,
    ): Promise<{ url: string; publicId: string }> {
        try {
            const result = await new Promise<UploadApiResponse>((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder,
                        resource_type: 'image',
                    },
                    (
                        error: UploadApiErrorResponse | undefined,
                        result: UploadApiResponse | undefined,
                    ) => {
                        if (error) return reject(error);
                        if (!result) return reject(new Error('Upload thất bại'));
                        resolve(result);
                    },
                );

                Readable.from(file.buffer).pipe(uploadStream);
            });

            return {
                url: result.secure_url,
                publicId: result.public_id,
            };
        } catch (error) {
            throw new InternalServerErrorException('Upload ảnh lên Cloudinary thất bại');
        }
    }

    async deleteImage(publicId: string): Promise<void> {
        try {
            await cloudinary.uploader.destroy(publicId, {
                resource_type: 'image',
            });
        } catch (error) {
            throw new InternalServerErrorException('Xóa ảnh trên Cloudinary thất bại');
        }
    }
}