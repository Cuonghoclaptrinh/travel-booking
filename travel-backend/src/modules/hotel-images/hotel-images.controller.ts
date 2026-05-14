import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HotelImagesService } from './hotel-images.service';
import { CreateHotelImageDto } from './dto/create-hotel-image.dto';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { Permissions } from '../access-control/decorators/permissions.decorator';

@Controller()
export class HotelImagesController {
  constructor(private readonly hotelImagesService: HotelImagesService) { }

  @Get('hotels/:id/images')
  getByHotel(@Param('id', ParseIntPipe) id: number) {
    return this.hotelImagesService.getByHotel(id);
  }

  @UseGuards(JwtAuthGuard , PermissionsGuard)
  @Post('admin/hotels/:id/images')
  @Permissions('hotel.update')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, callback) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

        if (!allowed.includes(file.mimetype)) {
          return callback(
            new BadRequestException('Chỉ cho phép jpg, jpeg, png, webp'),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateHotelImageDto,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file ảnh');
    }

    return this.hotelImagesService.uploadImage(
      id,
      file,
      dto.isDefault ?? false,
    );
  }

  @UseGuards(JwtAuthGuard , PermissionsGuard)
  @Post('admin/hotel-images/:imageId/set-default')
  @Permissions('hotel.update')
  setDefault(@Param('imageId', ParseIntPipe) imageId: number) {
    return this.hotelImagesService.setDefault(imageId);
  }

  @UseGuards(JwtAuthGuard , PermissionsGuard)
  @Delete('admin/hotel-images/:imageId')
  @Permissions('hotel.update')
  delete(@Param('imageId', ParseIntPipe) imageId: number) {
    return this.hotelImagesService.deleteImage(imageId);
  }
}