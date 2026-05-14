import { Type } from 'class-transformer';
import {
    IsDateString,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
} from 'class-validator';
import { BookingStatus, PaymentStatus } from '../booking.enums';

export class AdminQueryBookingsDto {
    @IsOptional()
    @IsString()
    @MaxLength(50)
    code?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    userId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    tourId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    departureId?: number;

    @IsOptional()
    @IsEnum(BookingStatus)
    bookingStatus?: BookingStatus;

    @IsOptional()
    @IsEnum(PaymentStatus)
    paymentStatus?: PaymentStatus;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    contactEmail?: string;

    @IsOptional()
    @IsDateString()
    createdFrom?: string;

    @IsOptional()
    @IsDateString()
    createdTo?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 20;
}