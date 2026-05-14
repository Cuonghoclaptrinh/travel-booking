import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { TourPackagesService } from './tour-packages.service';
import { CreateTourPackageDto } from './dto/create-tour-package.dto';
import { UpdateTourPackageDto } from './dto/update-tour-package.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { Permissions } from '../access-control/decorators/permissions.decorator';

@Controller('tours/admin/tours/:tourId/packages')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminTourPackagesController {
    constructor(
        private readonly tourPackagesService: TourPackagesService,
    ) { }

    @Get()
    @Permissions('tour.view')
    async getByTourId(@Param('tourId', ParseIntPipe) tourId: number) {
        return this.tourPackagesService.getByTourId(tourId);
    }

    @Get(':packageId')
    @Permissions('tour.view')
    async getById(
        @Param('tourId', ParseIntPipe) tourId: number,
        @Param('packageId', ParseIntPipe) packageId: number,
    ) {
        return this.tourPackagesService.getById(tourId, packageId);
    }

    @Post()
    @Permissions('tour.update')
    async create(
        @Param('tourId', ParseIntPipe) tourId: number,
        @Body() dto: CreateTourPackageDto,
    ) {
        return this.tourPackagesService.create(tourId, dto);
    }

    @Patch(':packageId')
    @Permissions('tour.update')
    async update(
        @Param('tourId', ParseIntPipe) tourId: number,
        @Param('packageId', ParseIntPipe) packageId: number,
        @Body() dto: UpdateTourPackageDto,
    ) {
        return this.tourPackagesService.update(tourId, packageId, dto);
    }

    @Patch(':packageId/set-default')
    @Permissions('tour.update')
    async setDefault(
        @Param('tourId', ParseIntPipe) tourId: number,
        @Param('packageId', ParseIntPipe) packageId: number,
    ) {
        return this.tourPackagesService.setDefault(tourId, packageId);
    }

    @Delete(':packageId')
    @Permissions('tour.update')
    async remove(
        @Param('tourId', ParseIntPipe) tourId: number,
        @Param('packageId', ParseIntPipe) packageId: number,
    ) {
        return this.tourPackagesService.remove(tourId, packageId);
    }
}
