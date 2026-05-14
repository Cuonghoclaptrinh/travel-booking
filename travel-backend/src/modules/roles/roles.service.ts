import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { BaseCrudService } from 'src/common/base/base-crud.service';
import { Role } from './entities/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, In, Repository } from 'typeorm';
import { QueryRoleDto } from './dto/query-role.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UserRole } from './entities/user-role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';

@Injectable()
export class RolesService extends BaseCrudService<Role> {
    constructor(
        @InjectRepository(Role)
        private readonly rolesRepository: Repository<Role>,

        @InjectRepository(UserRole)
        private readonly userRolesRepository: Repository<UserRole>,

        @InjectRepository(RolePermission)
        private readonly rolePermissionsRepository: Repository<RolePermission>,

        @InjectRepository(Permission)
        private readonly permissionsRepository: Repository<Permission>,

        private readonly dataSource: DataSource,
    ) {
        super(rolesRepository, "Role")
    }
    async createRole(dto: CreateRoleDto) {
        const existingByCode = await this.rolesRepository.findOne({
            where: { code: dto.code },
        });

        if (existingByCode) {
            throw new BadRequestException('Mã role đã tồn tại');
        }

        const role = await super.create({
            code: dto.code.trim().toLowerCase(),
            name: dto.name.trim(),
            description: dto.description?.trim(),
            isSystem: dto.isSystem ?? false,
        });

        return role;
    }

    async getRolesPaging(query: QueryRoleDto) {
        return this.getPaging(query, {
            where: query.keyword
                ? [
                    { code: ILike(`%${query.keyword}%`) },
                    { name: ILike(`%${query.keyword}%`) },
                    { description: ILike(`%${query.keyword}%`) },
                ]
                : {},
            order: { createdAt: 'DESC' },
        });
    }

    async getRoleById(id: string) {
        return this.findOne({ id } as any);
    }

    async updateRole(id: string, dto: UpdateRoleDto) {
        const currentRole = await this.rolesRepository.findOne({
            where: { id },
        });

        if (!currentRole) {
            throw new NotFoundException('Role không tồn tại');
        }

        if (dto.code && dto.code !== currentRole.code) {
            const existingByCode = await this.rolesRepository.findOne({
                where: { code: dto.code },
            });

            if (existingByCode) {
                throw new BadRequestException('Mã role đã tồn tại');
            }
        }

        const payload: Partial<Role> = {
            code: dto.code?.trim(),
            name: dto.name?.trim(),
            description: dto.description?.trim(),
        };

        if (dto.isSystem !== undefined) {
            payload.isSystem = dto.isSystem;
        }

        return this.update({ id } as any, payload);
    }

    async removeRole(id: string) {
        const role = await this.rolesRepository.findOne({
            where: { id },
        });

        if (!role) {
            throw new NotFoundException('Role không tồn tại');
        }

        if (role.isSystem) {
            throw new BadRequestException('Không được xóa role hệ thống');
        }

        await this.remove({ id } as any);
        return { message: 'Xóa role thành công' };
    }

    async getRolePermissions(roleId: string) {
        const role = await this.rolesRepository.findOne({
            where: { id: roleId },
        });

        if (!role) {
            throw new NotFoundException('Role không tồn tại');
        }

        const mappings = await this.rolePermissionsRepository.find({
            where: { roleId },
            relations: {
                permission: true,
            },
            order: {
                permissionId: 'ASC',
            },
        });

        return {
            role: {
                id: role.id,
                code: role.code,
                name: role.name,
            },
            permissions: mappings.map((item) => item.permission),
        };
    }

    async assignPermissionsToRole(roleId: string, dto: AssignPermissionsDto) {
        const role = await this.rolesRepository.findOne({
            where: { id: roleId },
        });

        if (!role) {
            throw new NotFoundException('Role không tồn tại');
        }

        const uniquePermissionIds = [...new Set(dto.permissionIds.map((id) => String(id)))];

        const permissions = await this.permissionsRepository.find({
            where: {
                id: In(uniquePermissionIds as any),
            },
        });

        if (permissions.length !== uniquePermissionIds.length) {
            throw new BadRequestException('Một hoặc nhiều permission không tồn tại');
        }

        await this.dataSource.transaction(async (manager) => {
            // await manager.delete(RolePermission, { roleId });
            const existingMappings = await manager.find(RolePermission, {
                where: { roleId },
            });

            if (existingMappings.length > 0) {
                await manager.remove(RolePermission, existingMappings);
            }
            if (uniquePermissionIds.length > 0) {
                const newMappings = uniquePermissionIds.map((permissionId) =>
                    manager.create(RolePermission, {
                        roleId,
                        permissionId,
                    }),
                );

                await manager.save(RolePermission, newMappings);
            }
        });

        return this.getRolePermissions(roleId);
    }
}
