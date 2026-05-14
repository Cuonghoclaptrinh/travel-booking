import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateAmenityDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name!: string;
}