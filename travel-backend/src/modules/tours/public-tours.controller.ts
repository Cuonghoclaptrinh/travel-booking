import { Controller, Get, Param, Query } from '@nestjs/common';
import { ToursService } from './tours.service';
import { QueryTourDto } from './dto/query-tour.dto';

@Controller('tours')
export class PublicToursController {
    constructor(private readonly toursService: ToursService) { }

    @Get()
    async getPublicPaging(@Query() query: QueryTourDto) {
        return this.toursService.findPublicPaging(query);
    }

    @Get(':slug')
    async getBySlug(@Param('slug') slug: string) {
        return this.toursService.findPublicBySlug(slug);
    }
}