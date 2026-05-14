import { AppDataSource } from '../data-source';
import { Permission } from '../../modules/permissions/entities/permission.entity';

const permissions: Partial<Permission>[] = [
    { code: 'user.view', name: 'Xem user', module: 'users' },
    { code: 'user.create', name: 'Tạo user', module: 'users' },
    { code: 'user.update', name: 'Sửa user', module: 'users' },
    { code: 'user.delete', name: 'Xóa user', module: 'users' },

    { code: 'role.view', name: 'Xem role', module: 'roles' },
    { code: 'role.create', name: 'Tạo role', module: 'roles' },
    { code: 'role.update', name: 'Sửa role', module: 'roles' },
    { code: 'role.delete', name: 'Xóa role', module: 'roles' },

    { code: 'permission.view', name: 'Xem permission', module: 'permissions' },
    { code: 'permission.create', name: 'Tạo permission', module: 'permissions' },
    { code: 'permission.update', name: 'Sửa permission', module: 'permissions' },
    { code: 'permission.delete', name: 'Xóa permission', module: 'permissions' },

    { code: 'tour.view', name: 'Xem tour', module: 'tours' },
    { code: 'tour.create', name: 'Tạo tour', module: 'tours' },
    { code: 'tour.update', name: 'Sửa tour', module: 'tours' },
    { code: 'tour.delete', name: 'Xóa tour', module: 'tours' },
];

async function seedPermissions() {
    await AppDataSource.initialize();

    const permissionRepository = AppDataSource.getRepository(Permission);

    for (const item of permissions) {
        const existing = await permissionRepository.findOne({
            where: { code: item.code },
        });

        if (!existing) {
            const permission = permissionRepository.create(item);
            await permissionRepository.save(permission);
            console.log(`Seeded: ${item.code}`);
        } else {
            console.log(`Skipped: ${item.code} already exists`);
        }
    }

    await AppDataSource.destroy();
}

seedPermissions()
    .then(() => {
        console.log('Permission seed completed');
        process.exit(0);
    })
    .catch(async (error) => {
        console.error('Permission seed failed:', error);
        await AppDataSource.destroy();
        process.exit(1);
    });
