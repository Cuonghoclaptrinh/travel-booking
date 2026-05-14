import {
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { Permissions } from '../access-control/decorators/permissions.decorator';
import { TourImagesService } from './tour-images.service';

@Controller('tours/admin/tours/:tourId/images')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminTourImagesController {
    constructor(private readonly tourImagesService: TourImagesService) { }

    @Get()
    @Permissions('tour.view')
    async getByTourId(@Param('tourId', ParseIntPipe) tourId: number) {
        return this.tourImagesService.getByTourId(tourId);
    }

    @Post()
    @UseInterceptors(FilesInterceptor('images', 10))
    @Permissions('tour.update')
    async uploadMany(
        @Param('tourId', ParseIntPipe) tourId: number,
        @UploadedFiles() files: Express.Multer.File[],
    ) {
        return this.tourImagesService.uploadMany(tourId, files);
    }

    @Patch(':imageId/set-default')
    @Permissions('tour.update')
    async setDefault(
        @Param('tourId', ParseIntPipe) tourId: number,
        @Param('imageId', ParseIntPipe) imageId: number,
    ) {
        return this.tourImagesService.setDefault(tourId, imageId);
    }

    @Delete(':imageId')
    @Permissions('tour.update')
    async remove(
        @Param('tourId', ParseIntPipe) tourId: number,
        @Param('imageId', ParseIntPipe) imageId: number,
    ) {
        return this.tourImagesService.remove(tourId, imageId);
    }
}