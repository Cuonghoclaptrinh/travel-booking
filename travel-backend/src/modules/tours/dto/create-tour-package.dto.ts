import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
} from 'class-validator';
import { TourPackageStatus } from '../tour.enums';

export class CreateTourPackageDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    code!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    priceAdult!: number;

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    priceChild!: number;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    hotelName?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    hotelStandard?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    hotelAddress?: string;

    @IsOptional()
    @IsString()
    hotelDescription?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    roomType?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    mealsIncluded?: string;

    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    allowGuideOption?: boolean;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    guideExtraPrice?: number;

    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isDefault?: boolean;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    sortOrder?: number;

    @IsOptional()
    @IsEnum(TourPackageStatus)
    status?: TourPackageStatus;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    @Max(100)
    discountPercent?: number;
}