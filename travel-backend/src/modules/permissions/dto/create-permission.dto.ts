import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePermissionDto {
    @IsString()
    @MaxLength(150)
    code!: string;

    @IsString()
    @MaxLength(255)
    name!: string;

    @IsString()
    @MaxLength(100)
    module!: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;
}