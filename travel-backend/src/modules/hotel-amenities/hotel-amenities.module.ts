import { Module } from '@nestjs/common';
import { HotelAmenitiesService } from './hotel-amenities.service';
import { HotelAmenitiesController } from './hotel-amenities.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HotelAmenity } from './entities/hotel-amenity.entity';
import { Hotel } from '../hotels/entities/hotel.entity';
import { Amenity } from '../amenities/entities/amenity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HotelAmenity, Hotel, Amenity])],
  providers: [HotelAmenitiesService],
  controllers: [HotelAmenitiesController],
  exports: [HotelAmenitiesService],
})
export class HotelAmenitiesModule { }
