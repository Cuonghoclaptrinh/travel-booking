import { ArrayNotEmpty, IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class AssignPermissionsDto {
    @IsArray()
    @ArrayNotEmpty()
    @Type(() => Number)
    @IsNumber({}, { each: true })
    permissionIds!: number[];
}