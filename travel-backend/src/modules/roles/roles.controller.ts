import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { Permissions } from '../access-control/decorators/permissions.decorator';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    @Post()
    @Permissions('role.create')
    create(@Body() dto: CreateRoleDto) {
        return this.rolesService.createRole(dto);
    }

    @Get()
    @Permissions('role.view')
    getPaging(@Query() query: QueryRoleDto) {
        return this.rolesService.getRolesPaging(query);
    }

    @Get(':id')
    @Permissions('role.view')
    findOne(@Param('id') id: string) {
        return this.rolesService.getRoleById(id);
    }

    @Patch(':id')
    @Permissions('role.update')
    update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
        return this.rolesService.updateRole(id, dto);
    }

    @Delete(':id')
    @Permissions('role.delete')
    remove(@Param('id') id: string) {
        return this.rolesService.removeRole(id);
    }

    @Get(':id/permissions')
    @Permissions('role.view')
    getPermissions(@Param('id') id: string) {
        return this.rolesService.getRolePermissions(id);
    }

    @Post(':id/permissions')
    @Permissions('role.update')
    assignPermissions(
        @Param('id') id: string,
        @Body() dto: AssignPermissionsDto,
    ) {
        return this.rolesService.assignPermissionsToRole(id, dto);
    }
}
