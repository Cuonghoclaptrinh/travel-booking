import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateVnpayPaymentUrlDto {
    @IsOptional()
    @IsString()
    @MaxLength(20)
    bankCode?: string;

    @IsOptional()
    @IsIn(['vn', 'en'])
    language?: 'vn' | 'en';
}