import { Module } from '@nestjs/common';
import { HotelImagesService } from './hotel-images.service';
import { HotelImagesController } from './hotel-images.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hotel } from '../hotels/entities/hotel.entity';
import { HotelImage } from './entities/hotel-image.entity';
import { CloudinaryModule } from 'src/common/cloudinary/cloudinary.module';

@Module({
  imports: [TypeOrmModule.forFeature([Hotel, HotelImage]), CloudinaryModule],
  providers: [HotelImagesService],
  controllers: [HotelImagesController],
  exports: [HotelImagesService],
})
export class HotelImagesModule { }
