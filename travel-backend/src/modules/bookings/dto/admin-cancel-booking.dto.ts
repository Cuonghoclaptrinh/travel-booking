import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminCancelBookingDto {
    @IsOptional()
    @IsString()
    @MaxLength(500)
    reason?: string;
}