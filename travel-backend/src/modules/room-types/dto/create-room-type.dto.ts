import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateRoomTypeDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    name: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    maxAdults?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    maxChildren?: number = 0;

    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    basePricePerNight: number;
}