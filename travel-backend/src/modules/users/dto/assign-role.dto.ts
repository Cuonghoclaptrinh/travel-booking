import { ArrayNotEmpty, IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class AssignRoleDto {
    @IsArray()
    @ArrayNotEmpty()
    @Type(() => Number)
    @IsNumber({}, { each: true })
    roleIds!: number[];
}