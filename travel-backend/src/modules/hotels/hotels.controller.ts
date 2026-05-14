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

import { HotelsService } from './hotels.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { QueryHotelDto } from './dto/query-hotel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { Permissions } from '../access-control/decorators/permissions.decorator';

@Controller()
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) { }

  @Get('hotels')
  getPublicList(@Query() query: QueryHotelDto) {
    return this.hotelsService.getPublicList(query);
  }

  @Get('hotels/:id')
  getPublicDetail(@Param('id', ParseIntPipe) id: number) {
    return this.hotelsService.getPublicDetail(id);
  }


  @Get('destinations/:destinationId/hotels')

  getByDestination(
    @Param('destinationId', ParseIntPipe) destinationId: number,
    @Query() query: QueryHotelDto,
  ) {
    return this.hotelsService.getByDestination(destinationId, query);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post('admin/hotels')
  @Permissions('hotel.create')
  create(@Body() dto: CreateHotelDto) {
    return this.hotelsService.createHotel(dto);
  }

  @UseGuards(JwtAuthGuard , PermissionsGuard)
  @Patch('admin/hotels/:id')
  @Permissions('hotel.update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHotelDto,
  ) {
    return this.hotelsService.updateHotel(id, dto);
  }

  @UseGuards(JwtAuthGuard,  PermissionsGuard)
  @Delete('admin/hotels/:id')
  @Permissions('hotel.delete')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.hotelsService.deleteHotel(id);
  }
}