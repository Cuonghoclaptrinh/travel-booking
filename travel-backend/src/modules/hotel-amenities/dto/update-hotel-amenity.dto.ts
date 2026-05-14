import { PartialType } from '@nestjs/mapped-types';
import { CreateHotelAmenityDto } from './create-hotel-amenity.dto';

export class UpdateHotelAmenityDto extends PartialType(CreateHotelAmenityDto) {}
