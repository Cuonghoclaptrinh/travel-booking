import { Transform, Type } from 'class-transformer';
import {
    IsBoolean,
    IsEmail,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    MaxLength,
    Min,
} from 'class-validator';

export class CreateBookingDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    tourId!: number;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    packageId!: number;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    departureId!: number;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    optionId!: number;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    adultCount!: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    childCount?: number;

    @IsOptional()
    @Transform(({ value }) => value === true || value === 'true')
    @IsBoolean()
    isPrivateGuide?: boolean;

    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    contactName!: string;

    @IsEmail()
    @MaxLength(255)
    contactEmail!: string;

    @IsOptional()
    @IsString()
    @MaxLength(30)
    @Matches(/^[0-9+\-\s()]+$/, {
        message: 'contactPhone is invalid',
    })
    contactPhone?: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    notes?: string;
}