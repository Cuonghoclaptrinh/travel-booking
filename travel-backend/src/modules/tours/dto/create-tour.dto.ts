import { Transform, Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    Min,
} from 'class-validator';

export class CreateTourDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    destinationId!: number;

    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name!: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    slug?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    shortDescription?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    durationDays!: number;

    @Type(() => Number)
    @IsInt()
    @Min(0)
    durationNights!: number;

    @IsOptional()
    @IsString()
    @MaxLength(1024)
    coverImageUrl?: string;



    @IsOptional()
    @IsString()
    highlights?: string;

    @IsOptional()
    @IsString()
    includedServices?: string;

    @IsOptional()
    @IsString()
    excludedServices?: string;

    @IsOptional()
    @IsString()
    termsAndConditions?: string;

    @IsOptional()
    @IsString()
    tourType?: string;

    @IsOptional()
    @Transform(({ value }) => {
        if (!value) return undefined;

        if (Array.isArray(value)) {
            return value;
        }

        if (typeof value === 'string') {
            return value
                .split(',')
                .map((x) => x.trim())
                .filter(Boolean);
        }

        return value;
    })
    @IsArray()
    featureTags?: string[];

    @IsOptional()
    @Transform(({ value }) => value === true || value === 'true' || value === 1 || value === '1')
    @IsBoolean()
    isFeatured?: boolean;

    @IsOptional()
    @Transform(({ value }) => value === true || value === 'true' || value === 1 || value === '1')
    @IsBoolean()
    isHotDeal?: boolean;
}
