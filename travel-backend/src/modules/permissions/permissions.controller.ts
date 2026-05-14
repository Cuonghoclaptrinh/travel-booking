import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { QueryPermissionDto } from './dto/query-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { Permissions } from '../access-control/decorators/permissions.decorator';

@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
    constructor(private readonly permissionsService: PermissionsService) { }

    @Post()
    @Permissions('permission.create')
    create(@Body() dto: CreatePermissionDto) {
        return this.permissionsService.createPermission(dto);
    }

    @Get()
    @Permissions('permission.view')
    getPaging(@Query() query: QueryPermissionDto) {
        return this.permissionsService.getPermissionsPaging(query);
    }

    @Get(':id')
    @Permissions('permission.view')
    findOne(@Param('id') id: string) {
        return this.permissionsService.getPermissionById(id);
    }

    @Patch(':id')
    @Permissions('permission.update')
    update(@Param('id') id: string, @Body() dto: UpdatePermissionDto) {
        return this.permissionsService.updatePermission(id, dto);
    }

    @Delete(':id')
    @Permissions('permission.delete')
    remove(@Param('id') id: string) {
        return this.permissionsService.removePermission(id);
    }
}
