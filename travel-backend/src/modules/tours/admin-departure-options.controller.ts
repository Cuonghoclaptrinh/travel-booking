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
import { DepartureOptionsService } from './departure-options.service';
import { CreateDepartureOptionDto } from './dto/create-departure-option.dto';
import { UpdateDepartureOptionDto } from './dto/update-departure-option.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { Permissions } from '../access-control/decorators/permissions.decorator';

@Controller('tours/admin/departures/:departureId/options')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminDepartureOptionsController {
    constructor(
        private readonly departureOptionsService: DepartureOptionsService,
    ) { }

    @Get()
    @Permissions('tour.view')
    async getByDepartureId(
        @Param('departureId', ParseIntPipe) departureId: number,
    ) {
        return this.departureOptionsService.getByDepartureId(departureId);
    }

    @Get(':optionId')
    @Permissions('tour.view')
    async getById(
        @Param('departureId', ParseIntPipe) departureId: number,
        @Param('optionId', ParseIntPipe) optionId: number,
    ) {
        return this.departureOptionsService.getById(departureId, optionId);
    }

    @Post()
    @Permissions('tour.update')
    async create(
        @Param('departureId', ParseIntPipe) departureId: number,
        @Body() dto: CreateDepartureOptionDto,
    ) {
        return this.departureOptionsService.create(departureId, dto);
    }

    @Patch(':optionId')
    @Permissions('tour.update')
    async update(
        @Param('departureId', ParseIntPipe) departureId: number,
        @Param('optionId', ParseIntPipe) optionId: number,
        @Body() dto: UpdateDepartureOptionDto,
    ) {
        return this.departureOptionsService.update(departureId, optionId, dto);
    }

    @Delete(':optionId')
    @Permissions('tour.update')
    async remove(
        @Param('departureId', ParseIntPipe) departureId: number,
        @Param('optionId', ParseIntPipe) optionId: number,
    ) {
        return this.departureOptionsService.remove(departureId, optionId);
    }
}
