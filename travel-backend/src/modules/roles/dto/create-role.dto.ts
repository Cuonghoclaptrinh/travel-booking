import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRoleDto {
    @IsString()
    @MaxLength(100)
    code!: string;

    @IsString()
    @MaxLength(255)
    name!: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @IsOptional()
    @IsBoolean()
    isSystem?: boolean;
}