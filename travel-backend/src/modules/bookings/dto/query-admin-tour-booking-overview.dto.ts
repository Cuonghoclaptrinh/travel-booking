import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { BookingStatus, PaymentStatus } from '../booking.enums';

export class QueryAdminTourBookingOverviewDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;

    @IsOptional()
    @Transform(({ value }) => Number(value))
    @IsInt()
    @Min(1)
    destinationId?: number;

    @IsOptional()
    @IsIn(Object.values(BookingStatus))
    bookingStatus?: BookingStatus;

    @IsOptional()
    @IsIn(Object.values(PaymentStatus))
    paymentStatus?: PaymentStatus;
}