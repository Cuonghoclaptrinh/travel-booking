import { Module } from '@nestjs/common';
import { RoomTypesService } from './room-types.service';
import { RoomTypesController } from './room-types.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomType } from './entities/room-type.entity';
import { Hotel } from '../hotels/entities/hotel.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RoomType, Hotel])],
  providers: [RoomTypesService],
  controllers: [RoomTypesController],
  exports: [RoomTypesService],
})
export class RoomTypesModule { }
