import { Module } from '@nestjs/common';
import { DestinationImagesService } from './destination-images.service';
import { DestinationImagesController } from './destination-images.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Destination } from '../destinations/entities/destination.entity';
import { DestinationImage } from './entities/destination-image.entity';
import { CloudinaryModule } from 'src/common/cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Destination, DestinationImage]),
    CloudinaryModule,
  ],
  providers: [DestinationImagesService],
  controllers: [DestinationImagesController],
  exports: [DestinationImagesService],
})
export class DestinationImagesModule { }
