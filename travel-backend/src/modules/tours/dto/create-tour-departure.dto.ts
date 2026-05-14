import { Type } from 'class-transformer';
import {
    IsDateString,
    IsEnum,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    MaxLength,
    Min,
} from 'class-validator';
import { TourDepartureStatus } from '../tour.enums';

export class CreateTourDepartureDto {
    @IsString()
    @MaxLength(100)
    code!: string;

    @IsDateString()
    departureDate!: string;

    @IsDateString()
    returnDate!: string;

    @IsOptional()
    @IsDateString()
    registrationDeadline?: string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    capacity!: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    basePriceAdjustment?: number;

    @IsOptional()
    @IsEnum(TourDepartureStatus)
    status?: TourDepartureStatus;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    staffInChargeId?: number;
}