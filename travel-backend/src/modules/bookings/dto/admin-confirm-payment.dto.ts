import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaymentMethod } from '../booking.enums';

export class AdminConfirmPaymentDto {
    @IsEnum(PaymentMethod)
    paymentMethod!: PaymentMethod;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    paymentReference?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    note?: string;
}