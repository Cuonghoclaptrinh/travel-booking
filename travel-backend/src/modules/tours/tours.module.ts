import { Module } from '@nestjs/common';
import { ToursService } from './tours.service';
// import { ToursController } from './tours.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tour } from './entities/tour.entity';
import { TourPackage } from './entities/tour-package.entity';
import { TourDeparture } from './entities/tour-departure.entity';
import { DepartureOption } from './entities/departure-option.entity';
import { AdminToursController } from './admin-tours.controller';
import { PublicToursController } from './public-tours.controller';
import { AdminTourPackagesController } from './admin-tour-packages.controller';
import { TourPackagesService } from './tour-packages.service';
import { AdminTourDeparturesController } from './admin-tour-departures.controller';
import { TourDeparturesService } from './tour-departures.service';
import { AdminDepartureOptionsController } from './admin-departure-options.controller';
import { DepartureOptionsService } from './departure-options.service';
import { CloudinaryModule } from 'src/common/cloudinary/cloudinary.module';
import { AdminTourImagesController } from './admin-tour-images.controller';
import { TourImagesService } from './tour-images.service';
import { TourImage } from './entities/tour-image.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tour,
      TourPackage,
      TourDeparture,
      DepartureOption,
      TourImage
    ]), CloudinaryModule,
  ],
  controllers: [AdminToursController, PublicToursController, AdminTourPackagesController, AdminTourDeparturesController, AdminDepartureOptionsController, AdminTourImagesController],
  providers: [ToursService, TourPackagesService, TourDeparturesService, DepartureOptionsService, TourImagesService],
  exports: [ToursService, TourPackagesService, TourDeparturesService, DepartureOptionsService, TourImagesService],
})
export class ToursModule { }
