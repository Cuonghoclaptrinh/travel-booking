import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { PaginationDto } from 'src/common/base/pagination.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignRoleDto } from './dto/assign-role.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { Permissions } from '../access-control/decorators/permissions.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
    constructor(private readonly userService: UsersService) { }

    @Post()
    @Permissions('user.create')
    create(@Body() dto: CreateUserDto) {
        return this.userService.createUser(dto);
    }

    @Get()
    @Permissions('user.view')
    getPaging(@Query() query: PaginationDto) {
        return this.userService.getUserPaging(query);
    }

    @Get(":id")
    @Permissions('user.view')
    fineOne(@Param('id') id: string) {
        return this.userService.getUserById(id);
    }

    @Patch(":id")
    @Permissions('user.update')
    update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
        return this.userService.updateUser(id, dto);
    }

    @Delete(":id")
    @Permissions('user.delete')
    remove(@Param('id') id: string) {
        return this.userService.removeUser(id);
    }

    @Get(':id/roles')
    @Permissions('user.view')
    getRoles(@Param('id') id: string) {
        return this.userService.getUserRoles(id);
    }

    @Post(':id/roles')
    @Permissions('user.update')
    assignRoles(@Param('id') id: string, @Body() dto: AssignRoleDto) {
        return this.userService.assignRoles(id, dto);
    }
}
