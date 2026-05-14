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

import { RoomTypesService } from './room-types.service';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
import { QueryRoomTypeDto } from './dto/query-room-type.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
export class RoomTypesController {
  constructor(private readonly roomTypesService: RoomTypesService) { }

  @Get('hotels/:hotelId/room-types')
  getByHotel(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Query() query: QueryRoomTypeDto,
  ) {
    return this.roomTypesService.getByHotel(hotelId, query);
  }

  @Get('room-types/:id')
  getDetail(@Param('id', ParseIntPipe) id: number) {
    return this.roomTypesService.getDetail(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/hotels/:hotelId/room-types')
  create(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Body() dto: CreateRoomTypeDto,
  ) {
    return this.roomTypesService.createRoomType(hotelId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/room-types/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoomTypeDto,
  ) {
    return this.roomTypesService.updateRoomType(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/room-types/:id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.roomTypesService.deleteRoomType(id);
  }
}