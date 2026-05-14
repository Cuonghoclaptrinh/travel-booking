import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { DestinationsService } from './destinations.service';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueryDestinationDto } from './dto/query-destination.dto';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { Permissions } from '../access-control/decorators/permissions.decorator';



@Controller('destinations')
export class DestinationsController {
  constructor(private readonly destinationsService: DestinationsService) { }

  @Get('destinations')
  getPublicList(@Query() query: QueryDestinationDto) {
    return this.destinationsService.getPublicList(query);
  }

  @Get('destinations/:id')
  getPublicDetail(@Param('id', ParseIntPipe) id: number) {
    return this.destinationsService.getPublicDetail(id);
  }

  @UseGuards(JwtAuthGuard , PermissionsGuard)
  @Post('admin/destinations')
  @Permissions('destination.create')
  create(@Body() dto: CreateDestinationDto) {
    return this.destinationsService.createDestination(dto);
  }

  @UseGuards(JwtAuthGuard , PermissionsGuard)
  @Patch('admin/destinations/:id')
  @Permissions('destination.update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDestinationDto,
  ) {
    return this.destinationsService.updateDestination(id, dto);
  }

  @UseGuards(JwtAuthGuard , PermissionsGuard)
  @Delete('admin/destinations/:id')
  @Permissions('destination.delete')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.destinationsService.deleteDestination(id);
  }
}
