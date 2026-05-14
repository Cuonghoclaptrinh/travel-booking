import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HotelAmenitiesService } from './hotel-amenities.service';
import { ReplaceHotelAmenitiesDto } from './dto/replace-hotel-amenities.dto';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { Permissions } from '../access-control/decorators/permissions.decorator';

@Controller()
export class HotelAmenitiesController {
  constructor(private readonly hotelAmenitiesService: HotelAmenitiesService) { }

  @Get('hotels/:hotelId/amenities')
  getByHotel(@Param('hotelId', ParseIntPipe) hotelId: number) {
    return this.hotelAmenitiesService.getByHotel(hotelId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Put('admin/hotels/:hotelId/amenities')
  @Permissions('hotel.update')
  replaceAmenities(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Body() dto: ReplaceHotelAmenitiesDto,
  ) {
    return this.hotelAmenitiesService.replaceAmenities(hotelId, dto.amenityIds);
  }
}