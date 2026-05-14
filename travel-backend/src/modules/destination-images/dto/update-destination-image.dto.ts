import { PartialType } from '@nestjs/mapped-types';
import { CreateDestinationImageDto } from './create-destination-image.dto';

export class UpdateDestinationImageDto extends PartialType(CreateDestinationImageDto) {}
