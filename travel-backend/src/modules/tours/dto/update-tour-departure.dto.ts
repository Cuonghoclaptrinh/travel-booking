import { PartialType } from '@nestjs/mapped-types';
import { CreateTourDepartureDto } from './create-tour-departure.dto';

export class UpdateTourDepartureDto extends PartialType(CreateTourDepartureDto) { }