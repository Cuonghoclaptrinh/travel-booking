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
import { DestinationImagesService } from './destination-images.service';
import { CreateDestinationImageDto } from './dto/create-destination-image.dto';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { Permissions } from '../access-control/decorators/permissions.decorator';
import { Permission } from '../permissions/entities/permission.entity';

@Controller()
export class DestinationImagesController {
  constructor(
    private readonly destinationImagesService: DestinationImagesService,
  ) { }

  @Get('destinations/:id/images')
  getByDestination(@Param('id', ParseIntPipe) id: number) {
    return this.destinationImagesService.getByDestination(id);
  }

  @UseGuards(JwtAuthGuard , PermissionsGuard)
  @Post('admin/destinations/:id/images')
  @Permissions('destination.update')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
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
    @Body() dto: CreateDestinationImageDto,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file ảnh');
    }

    return this.destinationImagesService.uploadImage(
      id,
      file,
      dto.isDefault ?? false,
    );
  }

  @UseGuards(JwtAuthGuard ,PermissionsGuard)
  @Post('admin/destination-images/:imageId/set-default')
  @Permissions('destination.update')
  setDefault(@Param('imageId', ParseIntPipe) imageId: number) {
    return this.destinationImagesService.setDefault(imageId);
  }

  @UseGuards(JwtAuthGuard,PermissionsGuard)
  @Delete('admin/destination-images/:imageId')
  @Permissions('destination.update')
  delete(@Param('imageId', ParseIntPipe) imageId: number) {
    return this.destinationImagesService.deleteImage(imageId);
  }
}