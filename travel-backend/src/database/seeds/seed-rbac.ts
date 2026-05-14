import "reflect-metadata";
import * as bcrypt from "bcrypt";
import { NestFactory } from "@nestjs/core";
import { DataSource, Repository } from "typeorm";

import { AppModule } from "src/app.module";
import { Permission } from "src/modules/permissions/entities/permission.entity";
import { Role } from "src/modules/roles/entities/role.entity";
import { RolePermission } from "src/modules/roles/entities/role-permission.entity";
import { User } from "src/modules/users/entities/user.entity";
import { UserRole } from "src/modules/roles/entities/user-role.entity";

type PermissionSeed = {
    code: string;
    name: string;
    module: string;
    description?: string;
};

type RoleSeed = {
    code: string;
    name: string;
    description?: string;
    isSystem?: boolean;
};

const RBAC_PERMISSIONS: PermissionSeed[] = [
    // permission
    {
        code: "permission.view",
        name: "Xem permission",
        module: "permission",
        description: "Cho phép xem danh sách permission",
    },
    {
        code: "permission.create",
        name: "Tạo permission",
        module: "permission",
        description: "Cho phép tạo permission",
    },
    {
        code: "permission.update",
        name: "Cập nhật permission",
        module: "permission",
        description: "Cho phép cập nhật permission",
    },
    {
        code: "permission.delete",
        name: "Xóa permission",
        module: "permission",
        description: "Cho phép xóa permission",
    },

    // role
    {
        code: "role.view",
        name: "Xem role",
        module: "role",
        description: "Cho phép xem danh sách role",
    },
    {
        code: "role.create",
        name: "Tạo role",
        module: "role",
        description: "Cho phép tạo role",
    },
    {
        code: "role.update",
        name: "Cập nhật role",
        module: "role",
        description: "Cho phép cập nhật role",
    },
    {
        code: "role.delete",
        name: "Xóa role",
        module: "role",
        description: "Cho phép xóa role",
    },

    // user
    {
        code: "user.view",
        name: "Xem user",
        module: "user",
        description: "Cho phép xem danh sách user",
    },
    {
        code: "user.create",
        name: "Tạo user",
        module: "user",
        description: "Cho phép tạo user",
    },
    {
        code: "user.update",
        name: "Cập nhật user",
        module: "user",
        description: "Cho phép cập nhật user",
    },
    {
        code: "user.delete",
        name: "Xóa user",
        module: "user",
        description: "Cho phép xóa user",
    },
];

/**
 * Seed thêm permission cho các API business mà FE admin đang có.
 * Nếu controller của bạn dùng code khác (ví dụ destination.view hay hotel.view)
 * thì sửa list này cho khớp.
 */
const BUSINESS_PERMISSIONS: PermissionSeed[] = [
    // destination
    {
        code: "destination.view",
        name: "Xem điểm đến",
        module: "destination",
        description: "Cho phép xem danh sách điểm đến",
    },
    {
        code: "destination.create",
        name: "Tạo điểm đến",
        module: "destination",
        description: "Cho phép tạo điểm đến",
    },
    {
        code: "destination.update",
        name: "Cập nhật điểm đến",
        module: "destination",
        description: "Cho phép cập nhật điểm đến",
    },
    {
        code: "destination.delete",
        name: "Xóa điểm đến",
        module: "destination",
        description: "Cho phép xóa điểm đến",
    },

    // amenity
    {
        code: "amenity.view",
        name: "Xem tiện ích",
        module: "amenity",
        description: "Cho phép xem danh sách tiện ích",
    },
    {
        code: "amenity.create",
        name: "Tạo tiện ích",
        module: "amenity",
        description: "Cho phép tạo tiện ích",
    },
    {
        code: "amenity.update",
        name: "Cập nhật tiện ích",
        module: "amenity",
        description: "Cho phép cập nhật tiện ích",
    },
    {
        code: "amenity.delete",
        name: "Xóa tiện ích",
        module: "amenity",
        description: "Cho phép xóa tiện ích",
    },

    // hotel
    {
        code: "hotel.view",
        name: "Xem khách sạn",
        module: "hotel",
        description: "Cho phép xem danh sách khách sạn",
    },
    {
        code: "hotel.create",
        name: "Tạo khách sạn",
        module: "hotel",
        description: "Cho phép tạo khách sạn",
    },
    {
        code: "hotel.update",
        name: "Cập nhật khách sạn",
        module: "hotel",
        description: "Cho phép cập nhật khách sạn",
    },
    {
        code: "hotel.delete",
        name: "Xóa khách sạn",
        module: "hotel",
        description: "Cho phép xóa khách sạn",
    },
    {
        code: "tour.view",
        name: "Xem tour",
        module: "tour",
        description: "Cho phép xem danh sách tour và cấu hình tour",
    },
    {
        code: "tour.create",
        name: "Tạo tour",
        module: "tour",
        description: "Cho phép tạo tour",
    },
    {
        code: "tour.update",
        name: "Cập nhật tour",
        module: "tour",
        description: "Cho phép cập nhật tour, package, departure và option",
    },
    {
        code: "tour.delete",
        name: "Xóa tour",
        module: "tour",
        description: "Cho phép xóa tour",
    },
];

const ROLES: RoleSeed[] = [
    {
        code: "super_admin",
        name: "Super Admin",
        description: "Toàn quyền hệ thống",
        isSystem: true,
    },
    {
        code: "admin",
        name: "Admin",
        description: "Quản trị hệ thống",
        isSystem: true,
    },
    {
        code: "staff",
        name: "Staff",
        description: "Nhân viên quản trị",
        isSystem: false,
    },
    {
        code: "customer",
        name: "Customer",
        description: "Người dùng thông thường",
        isSystem: false,
    },
];

const FULL_ADMIN_ACCOUNT = {
    name: "Super Admin",
    email: "superadmin@tourtravel.local",
    phone: "0900000000",
    password: "Admin@123456",
};

const ADMIN_ACCOUNT = {
    name: "System Admin",
    email: "admin@tourtravel.local",
    phone: "0900000001",
    password: "Admin@123456",
};

const STAFF_ACCOUNT = {
    name: "System Staff",
    email: "staff@tourtravel.local",
    phone: "0900000002",
    password: "Admin@123456",
};

const CUSTOMER_ACCOUNT = {
    name: "Sample Customer",
    email: "customer@tourtravel.local",
    phone: "0900000003",
    password: "Customer@123",
};

async function upsertPermission(
    repo: Repository<Permission>,
    item: PermissionSeed
): Promise<Permission> {
    const normalizedCode = item.code.trim().toLowerCase();
    const normalizedModule = item.module.trim().toLowerCase();

    let permission = await repo.findOne({
        where: { code: normalizedCode },
    });

    if (!permission) {
        permission = repo.create({
            code: normalizedCode,
            name: item.name.trim(),
            module: normalizedModule,
            ...(item.description ? { description: item.description.trim() } : {}),
        });
    } else {
        permission.code = normalizedCode;
        permission.name = item.name.trim();
        permission.module = normalizedModule;
        permission.description = item.description?.trim();
    }

    return repo.save(permission);
}

async function upsertRole(repo: Repository<Role>, item: RoleSeed): Promise<Role> {
    const normalizedCode = item.code.trim().toLowerCase();

    let role = await repo.findOne({
        where: { code: normalizedCode },
    });

    if (!role) {
        role = repo.create({
            code: normalizedCode,
            name: item.name.trim(),
            isSystem: !!item.isSystem,
            ...(item.description ? { description: item.description.trim() } : {}),
        });
    } else {
        role.code = normalizedCode;
        role.name = item.name.trim();
        role.isSystem = !!item.isSystem;
        role.description = item.description?.trim();
    }

    return repo.save(role);
}

async function upsertUser(
    repo: Repository<User>,
    item: {
        name: string;
        email: string;
        phone?: string;
        password: string;
    }
): Promise<User> {
    let user = await repo.findOne({
        where: { email: item.email.trim().toLowerCase() },
    });

    const passwordHash = await bcrypt.hash(item.password, 10);

    if (!user) {
        user = repo.create({
            name: item.name.trim(),
            email: item.email.trim().toLowerCase(),
            ...(item.phone ? { phone: item.phone.trim() } : {}),
            passwordHash,
            isActive: true,
            isVerified: true,
        });
    } else {
        user.name = item.name.trim();
        user.email = item.email.trim().toLowerCase();
        user.phone = item.phone?.trim();
        user.passwordHash = passwordHash;
        user.isActive = true;
        user.isVerified = true;
    }

    return repo.save(user);
}

async function assignPermissionsToRole(
    rolePermissionRepo: Repository<RolePermission>,
    role: Role,
    permissions: Permission[]
) {
    await rolePermissionRepo.delete({
        roleId: String(role.id),
    });

    if (!permissions.length) return;

    const rows = permissions.map((permission) =>
        rolePermissionRepo.create({
            roleId: String(role.id),
            permissionId: String(permission.id),
        })
    );

    await rolePermissionRepo.save(rows);
}

async function assignRolesToUser(
    userRoleRepo: Repository<UserRole>,
    user: User,
    roles: Role[]
) {
    await userRoleRepo.delete({
        userId: String(user.id),
    });

    if (!roles.length) return;

    const rows = roles.map((role) =>
        userRoleRepo.create({
            userId: String(user.id),
            roleId: String(role.id),
        })
    );

    await userRoleRepo.save(rows);
}

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    const permissionRepo = dataSource.getRepository(Permission);
    const roleRepo = dataSource.getRepository(Role);
    const rolePermissionRepo = dataSource.getRepository(RolePermission);
    const userRepo = dataSource.getRepository(User);
    const userRoleRepo = dataSource.getRepository(UserRole);

    try {
        console.log("=== START SEED RBAC ===");

        const allPermissionSeeds = [...RBAC_PERMISSIONS, ...BUSINESS_PERMISSIONS];

        const seededPermissions: Permission[] = [];
        for (const item of allPermissionSeeds) {
            const permission = await upsertPermission(permissionRepo, item);
            seededPermissions.push(permission);
        }
        console.log(`Seeded permissions: ${seededPermissions.length}`);

        const seededRoles: Record<string, Role> = {};
        for (const item of ROLES) {
            const role = await upsertRole(roleRepo, item);
            seededRoles[role.code] = role;
        }
        console.log(`Seeded roles: ${Object.keys(seededRoles).length}`);

        // Role permission strategy
        const allPermissions = seededPermissions;

        const adminPermissions = seededPermissions.filter((p) =>
            !["role.delete", "permission.delete"].includes(p.code)
        );

        const staffPermissions = seededPermissions.filter((p) =>
            [
                "user.view",
                "user.create",
                "user.update",
                "role.view",
                "permission.view",
                "destination.view",
                "destination.create",
                "destination.update",
                "amenity.view",
                "amenity.create",
                "amenity.update",
                "hotel.view",
                "hotel.create",
                "hotel.update",
                "tour.view",
                "tour.create",
                "tour.update",
            ].includes(p.code)
        );

        const customerPermissions: Permission[] = [];

        await assignPermissionsToRole(
            rolePermissionRepo,
            seededRoles["super_admin"],
            allPermissions
        );

        await assignPermissionsToRole(
            rolePermissionRepo,
            seededRoles["admin"],
            adminPermissions
        );

        await assignPermissionsToRole(
            rolePermissionRepo,
            seededRoles["staff"],
            staffPermissions
        );

        await assignPermissionsToRole(
            rolePermissionRepo,
            seededRoles["customer"],
            customerPermissions
        );

        console.log("Assigned permissions to roles");

        const superAdminUser = await upsertUser(userRepo, FULL_ADMIN_ACCOUNT);
        const adminUser = await upsertUser(userRepo, ADMIN_ACCOUNT);
        const staffUser = await upsertUser(userRepo, STAFF_ACCOUNT);
        const customerUser = await upsertUser(userRepo, CUSTOMER_ACCOUNT);

        await assignRolesToUser(userRoleRepo, superAdminUser, [
            seededRoles["super_admin"],
        ]);

        await assignRolesToUser(userRoleRepo, adminUser, [seededRoles["admin"]]);

        await assignRolesToUser(userRoleRepo, staffUser, [seededRoles["staff"]]);

        await assignRolesToUser(userRoleRepo, customerUser, [
            seededRoles["customer"],
        ]);

        console.log("Assigned roles to users");

        console.log("=== SEED DONE ===");
        console.log("Full access account:");
        console.log(`Email: ${FULL_ADMIN_ACCOUNT.email}`);
        console.log(`Password: ${FULL_ADMIN_ACCOUNT.password}`);
    } catch (error) {
        console.error("Seed failed:", error);
    } finally {
        await app.close();
    }
}

bootstrap();
