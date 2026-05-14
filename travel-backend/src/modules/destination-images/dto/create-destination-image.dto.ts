import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class CreateDestinationImageDto {
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    isDefault?: boolean = false;
}