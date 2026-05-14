import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UploadedFile,
    UseInterceptors,
    UseGuards,
} from '@nestjs/common';
import { ToursService } from './tours.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { QueryTourDto } from './dto/query-tour.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { Permissions } from '../access-control/decorators/permissions.decorator';

@Controller('tours/admin/tours')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminToursController {
    constructor(private readonly toursService: ToursService) { }

    @Get()
    @Permissions('tour.view')
    async getPaging(@Query() query: QueryTourDto) {
        return this.toursService.findAdminPaging(query);
    }

    @Get(':id')
    @Permissions('tour.view')
    async getById(@Param('id', ParseIntPipe) id: number) {
        return this.toursService.findAdminById(id);
    }

    @Post()
    @UseInterceptors(FileInterceptor('image'))
    @Permissions('tour.create')
    async create(@Body() dto: CreateTourDto, @UploadedFile() file?: Express.Multer.File,) {
        return this.toursService.create(dto, file);
    }

    @Patch(':id')
    @UseInterceptors(FileInterceptor('image'))
    @Permissions('tour.update')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateTourDto,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        return this.toursService.update(id, dto, file);
    }

    @Patch(':id/publish')
    @Permissions('tour.update')
    async publish(@Param('id', ParseIntPipe) id: number) {
        return this.toursService.publish(id);
    }

    @Patch(':id/close')
    @Permissions('tour.update')
    async close(@Param('id', ParseIntPipe) id: number) {
        return this.toursService.close(id);
    }

    @Delete(':id')
    @Permissions('tour.delete')
    async remove(@Param('id', ParseIntPipe) id: number) {
        return this.toursService.remove(id);
    }
}
