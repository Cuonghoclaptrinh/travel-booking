import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsersService } from '../../users/users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole } from 'src/modules/roles/entities/user-role.entity';
import { Repository } from 'typeorm';
import { RolePermission } from 'src/modules/roles/entities/role-permission.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        configService: ConfigService,
        private readonly usersService: UsersService,

        @InjectRepository(UserRole)
        private readonly userRoleRepository: Repository<UserRole>,

        @InjectRepository(RolePermission)
        private readonly rolePermissionRepository: Repository<RolePermission>
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_ACCESS_SECRET')!,
        });
    }

    async validate(payload: { sub: string; email: string }) {
        const user = await this.usersService.findByEmail(payload.email);

        if (!user || !user.isActive) {
            throw new UnauthorizedException('Token không hợp lệ hoặc user đã bị khóa');
        }

        const userRoleMappings = await this.userRoleRepository.find({
            where: { userId: String(user.id) },
            relations: {
                role: true,
            }
        })

        const roles = userRoleMappings.map((item) => item.role);

        const roleIds = roles.map((role) => String(role.id));

        let permissions: string[] = [];

        if (roleIds.length > 0) {
            const rolePermissionMappings = await this.rolePermissionRepository.find({
                where: roleIds.map((roleId) => ({ roleId })),
                relations: {
                    permission: true,
                }
            })
            permissions = [
                ...new Set(rolePermissionMappings.map((item) => item.permission.code)),
            ]
        }

        return {
            userId: user.id,
            email: user.email,
            name: user.name,
            roles: roles.map((role) => role.code),
            permissions,
        };
    }
}