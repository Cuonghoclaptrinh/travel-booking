import { Type } from 'class-transformer';
import {
    IsDateString,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    MaxLength,
    Min,
} from 'class-validator';
import { DepartureOptionStatus, TransportType } from '../tour.enums';

export class CreateDepartureOptionDto {
    @IsString()
    @MaxLength(150)
    departureCity!: string;

    @IsEnum(TransportType)
    transportType!: TransportType;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    extraPrice?: number;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    meetingPoint?: string;

    @IsOptional()
    @IsDateString()
    startTime?: string;

    @IsOptional()
    @IsDateString()
    endTime?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsEnum(DepartureOptionStatus)
    status?: DepartureOptionStatus;
}