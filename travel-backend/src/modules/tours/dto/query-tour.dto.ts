import { Transform, Type } from 'class-transformer';
import {
    IsBoolean,
    IsEnum,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    MaxLength,
    Min,
} from 'class-validator';
import { TourStatus } from '../tour.enums';

export class QueryTourDto {
    @IsOptional()
    @IsString()
    @MaxLength(255)
    search?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    destinationId?: number;

    @IsOptional()
    @IsEnum(TourStatus)
    status?: TourStatus;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit: number = 10;

    @IsOptional()
    @Transform(({ value }) => Number(value))
    @IsNumber()
    priceMin?: number;

    @IsOptional()
    @Transform(({ value }) => Number(value))
    @IsNumber()
    priceMax?: number;

    @IsOptional()
    @Transform(({ value }) => Number(value))
    @IsNumber()
    durationMin?: number;

    @IsOptional()
    @Transform(({ value }) => Number(value))
    @IsNumber()
    durationMax?: number;

    @IsOptional()
    @IsString()
    departureFrom?: string;

    @IsOptional()
    @IsString()
    departureTo?: string;

    @IsOptional()
    @IsString()
    tourType?: string;

    @IsOptional()
    @IsString()
    feature?: string;

    @IsOptional()
    @Transform(({ value }) => value === true || value === 'true')
    @IsBoolean()
    isFeatured?: boolean;

    @IsOptional()
    @Transform(({ value }) => value === true || value === 'true')
    @IsBoolean()
    isHotDeal?: boolean;

}