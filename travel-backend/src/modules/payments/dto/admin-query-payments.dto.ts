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
import { PaymentProvider, PaymentTransactionStatus } from '../payment.enums';

export class AdminQueryPaymentsDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    transactionRef?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    providerTransactionId?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    bookingId?: number;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    bookingCode?: string;

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
    @IsEnum(PaymentProvider)
    provider?: PaymentProvider;

    @IsOptional()
    @IsEnum(PaymentTransactionStatus)
    status?: PaymentTransactionStatus;

    @IsOptional()
    @IsDateString()
    createdFrom?: string;

    @IsOptional()
    @IsDateString()
    createdTo?: string;

    @IsOptional()
    @IsDateString()
    paidFrom?: string;

    @IsOptional()
    @IsDateString()
    paidTo?: string;

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