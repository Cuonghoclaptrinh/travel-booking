import { PartialType } from '@nestjs/mapped-types';
import { CreateDepartureOptionDto } from './create-departure-option.dto';

export class UpdateDepartureOptionDto extends PartialType(CreateDepartureOptionDto) { }