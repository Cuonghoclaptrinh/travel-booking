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
import { TourDeparturesService } from './tour-departures.service';
import { CreateTourDepartureDto } from './dto/create-tour-departure.dto';
import { UpdateTourDepartureDto } from './dto/update-tour-departure.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { Permissions } from '../access-control/decorators/permissions.decorator';

@Controller('tours/admin/tours/:tourId/departures')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminTourDeparturesController {
    constructor(
        private readonly tourDeparturesService: TourDeparturesService,
    ) { }

    @Get()
    @Permissions('tour.view')
    async getByTourId(@Param('tourId', ParseIntPipe) tourId: number) {
        return this.tourDeparturesService.getByTourId(tourId);
    }

    @Get(':departureId')
    @Permissions('tour.view')
    async getById(
        @Param('tourId', ParseIntPipe) tourId: number,
        @Param('departureId', ParseIntPipe) departureId: number,
    ) {
        return this.tourDeparturesService.getById(tourId, departureId);
    }

    @Post()
    @Permissions('tour.update')
    async create(
        @Param('tourId', ParseIntPipe) tourId: number,
        @Body() dto: CreateTourDepartureDto,
    ) {
        return this.tourDeparturesService.create(tourId, dto);
    }

    @Patch(':departureId')
    @Permissions('tour.update')
    async update(
        @Param('tourId', ParseIntPipe) tourId: number,
        @Param('departureId', ParseIntPipe) departureId: number,
        @Body() dto: UpdateTourDepartureDto,
    ) {
        return this.tourDeparturesService.update(tourId, departureId, dto);
    }

    @Patch(':departureId/open')
    @Permissions('tour.update')
    async open(
        @Param('tourId', ParseIntPipe) tourId: number,
        @Param('departureId', ParseIntPipe) departureId: number,
    ) {
        return this.tourDeparturesService.open(tourId, departureId);
    }

    @Patch(':departureId/close')
    @Permissions('tour.update')
    async close(
        @Param('tourId', ParseIntPipe) tourId: number,
        @Param('departureId', ParseIntPipe) departureId: number,
    ) {
        return this.tourDeparturesService.close(tourId, departureId);
    }

    @Patch(':departureId/cancel')
    @Permissions('tour.update')
    async cancel(
        @Param('tourId', ParseIntPipe) tourId: number,
        @Param('departureId', ParseIntPipe) departureId: number,
    ) {
        return this.tourDeparturesService.cancel(tourId, departureId);
    }

    @Delete(':departureId')
    @Permissions('tour.update')
    async remove(
        @Param('tourId', ParseIntPipe) tourId: number,
        @Param('departureId', ParseIntPipe) departureId: number,
    ) {
        return this.tourDeparturesService.remove(tourId, departureId);
    }
}
