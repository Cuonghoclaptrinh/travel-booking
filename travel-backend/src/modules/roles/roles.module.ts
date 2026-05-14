import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolePermission } from './entities/role-permission.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { RolesController } from './roles.controller';
import { Permission } from '../permissions/entities/permission.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Role, UserRole, RolePermission, Permission])],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService, TypeOrmModule]
})
export class RolesModule { }
