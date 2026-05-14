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
  UseGuards,
} from '@nestjs/common';

import { AmenitiesService } from './amenities.service';
import { CreateAmenityDto } from './dto/create-amenity.dto';
import { UpdateAmenityDto } from './dto/update-amenity.dto';
import { QueryAmenityDto } from './dto/query-amenity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
export class AmenitiesController {
  constructor(private readonly amenitiesService: AmenitiesService) { }

  @Get('amenities')
  getPublicList(@Query() query: QueryAmenityDto) {
    return this.amenitiesService.getPublicList(query);
  }

  @Get('amenities/:id')
  getDetail(@Param('id', ParseIntPipe) id: number) {
    return this.amenitiesService.getDetail(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/amenities')
  create(@Body() dto: CreateAmenityDto) {
    return this.amenitiesService.createAmenity(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/amenities/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAmenityDto,
  ) {
    return this.amenitiesService.updateAmenity(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/amenities/:id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.amenitiesService.deleteAmenity(id);
  }
}