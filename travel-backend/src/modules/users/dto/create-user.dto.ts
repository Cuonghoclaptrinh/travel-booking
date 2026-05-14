import { IsEmail, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
    @IsString()
    @MaxLength(255)
    name!: string;

    @IsEmail()
    @MaxLength(255)
    email!: string;

    // @IsOptional()
    // @IsString()
    // @MaxLength(20)
    // phone?: string;

    @IsString()
    @MinLength(6)
    @MaxLength(50)
    password!: string;


}