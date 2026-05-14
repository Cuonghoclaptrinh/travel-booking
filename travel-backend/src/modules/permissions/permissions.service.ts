import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { BaseCrudService } from 'src/common/base/base-crud.service';
import { Permission } from './entities/permission.entity';
import { Repository, ILike } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { QueryPermissionDto } from './dto/query-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService extends BaseCrudService<Permission> {
    constructor(
        @InjectRepository(Permission)
        private readonly permissionsRepository: Repository<Permission>,
    ) {
        super(permissionsRepository, 'Permission');
    }

    async createPermission(dto: CreatePermissionDto) {
        const normalizedCode = dto.code.trim().toLowerCase();
        const normalizedModule = dto.module.trim().toLowerCase();

        const existingByCode = await this.permissionsRepository.findOne({
            where: { code: normalizedCode },
        });

        if (existingByCode) {
            throw new BadRequestException('Mã permission đã tồn tại');
        }

        return super.create({
            code: normalizedCode,
            name: dto.name.trim(),
            module: normalizedModule,
            description: dto.description?.trim(),
        });
    }

    async getPermissionsPaging(query: QueryPermissionDto) {
        const whereConditions: any[] = [];

        if (query.keyword) {
            whereConditions.push(
                { code: ILike(`%${query.keyword}%`) },
                { name: ILike(`%${query.keyword}%`) },
                { description: ILike(`%${query.keyword}%`) },
            );
        }

        if (query.module && query.keyword) {
            whereConditions.length = 0;
            whereConditions.push(
                { code: ILike(`%${query.keyword}%`), module: query.module.toLowerCase() },
                { name: ILike(`%${query.keyword}%`), module: query.module.toLowerCase() },
                { description: ILike(`%${query.keyword}%`), module: query.module.toLowerCase() },
            );
        }

        if (query.module && !query.keyword) {
            whereConditions.push({ module: query.module.toLowerCase() });
        }

        return this.getPaging(query, {
            where: whereConditions.length > 0 ? whereConditions : {},
            order: { createdAt: 'DESC' },
        });
    }

    async getPermissionById(id: string) {
        return this.findOne({ id } as any);
    }

    async updatePermission(id: string, dto: UpdatePermissionDto) {
        const currentPermission = await this.permissionsRepository.findOne({
            where: { id },
        });

        if (!currentPermission) {
            throw new NotFoundException('Permission không tồn tại');
        }

        if (dto.code) {
            const normalizedCode = dto.code.trim().toLowerCase();
            if (normalizedCode !== currentPermission.code) {
                const existingByCode = await this.permissionsRepository.findOne({
                    where: { code: normalizedCode },
                });

                if (existingByCode) {
                    throw new BadRequestException('Mã permission đã tồn tại');
                }
            }
        }

        const payload: Partial<Permission> = {
            code: dto.code?.trim().toLowerCase(),
            name: dto.name?.trim(),
            module: dto.module?.trim().toLowerCase(),
            description: dto.description?.trim(),
        };

        return this.update({ id } as any, payload);
    }

    async removePermission(id: string) {
        const permission = await this.permissionsRepository.findOne({
            where: { id },
        });

        if (!permission) {
            throw new NotFoundException('Permission không tồn tại');
        }

        await this.hardRemove({ id } as any);
        return { message: 'Xóa permission thành công' };
    }
}
