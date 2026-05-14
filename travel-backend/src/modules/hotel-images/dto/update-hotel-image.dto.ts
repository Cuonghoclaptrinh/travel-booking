import { PartialType } from '@nestjs/mapped-types';
import { CreateHotelImageDto } from './create-hotel-image.dto';

export class UpdateHotelImageDto extends PartialType(CreateHotelImageDto) {}
