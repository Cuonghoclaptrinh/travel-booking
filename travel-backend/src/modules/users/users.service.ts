import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BaseCrudService } from 'src/common/base/base-crud.service';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository, DataSource, In } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { emitWarning } from 'process';
import { PaginationDto } from 'src/common/base/pagination.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../roles/entities/role.entity';
import { UserRole } from '../roles/entities/user-role.entity';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';


@Injectable()
export class UsersService extends BaseCrudService<User> {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Role)
        private readonly rolesRepository: Repository<Role>,

        @InjectRepository(UserRole)
        private readonly userRolesRepository: Repository<UserRole>,
        private readonly cloudinaryService: CloudinaryService,
        private readonly dataSource: DataSource,
    ) {
        super(userRepository, 'User');
    }

    private sanitize(user: User) {
        const { passwordHash, ...rest } = user;
        return rest;
    }

    async createUser(createUserDto: CreateUserDto) {
        const existingUser = await this.userRepository.findOneBy({
            email: createUserDto.email
        });
        if (existingUser) {
            throw new BadRequestException('email đã tồn tại ')
        }

        const passwordHash = await bcrypt.hash(createUserDto.password, 10);

        const user = await super.create({
            name: createUserDto.name,
            email: createUserDto.email,
            passwordHash,
            isActive: true,
            isVerified: false
        });

        await this.assignDefaultCustomerRole(user.id);

        return this.sanitize(user);
    }

    async getUserPaging(query: PaginationDto) {
        const result = await this.getPaging(query, {
            where: query.keyword
                ? [
                    { name: ILike(`%${query.keyword}%`) },
                    { email: ILike(`%${query.keyword}%`) },
                    { phone: ILike(`%${query.keyword}%`) }
                ]
                : {},
            order: { createdAt: "DESC" }
        })

        return {
            ...result,
            data: result.data.map((user) => this.sanitize(user))
        }
    }

    async getUserById(id: string) {
        const user = await this.findOne({ id } as any);
        return this.sanitize(user);
    }

    async findByEmail(email: string) {
        return this.userRepository.findOne({
            where: { email },
        });
    }

    async findByEmailWithPassword(email: string) {
        return this.userRepository
            .createQueryBuilder('user')
            .addSelect('user.passwordHash')
            .where('user.email = :email', { email })
            .getOne();
    }


    async updateUser(id: string, dto: UpdateUserDto) {
        const currentUser = await this.userRepository.findOneBy({ id });
        if (!currentUser) {
            throw new BadRequestException("user không tồn tại ");
        }
        if (dto.email && dto.email !== currentUser.email) {
            const existingUser = await this.userRepository.findOneBy({ email: dto.email });
            if (existingUser) {
                throw new BadRequestException('Email đã tồn tại');
            }
        }

        const payload: Partial<User> = {
            name: dto.name,
            email: dto.email,
            // phone: dto.phone
        }
        if (dto.password) {
            payload.passwordHash = await bcrypt.hash(dto.password, 10);
        }

        const updated = await this.update({ id } as any, payload);
        return this.sanitize(updated)
    }

    async removeUser(id: string) {
        await this.hardRemove({ id } as any);
        return { message: "xoá user thành công" };
    }

    async getUserRoles(userId: string) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User không tồn tại');
        }

        const mappings = await this.userRolesRepository.find({
            where: { userId },
            relations: {
                role: true,
            },
            order: {
                roleId: 'ASC',
            },
        });

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
            roles: mappings.map((item) => item.role),
        };
    }

    async assignRoles(userId: string, dto: AssignRoleDto, assignedBy?: string) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User không tồn tại');
        }

        const uniqueRoleIds = [...new Set(dto.roleIds.map((id) => Number(id)))];

        const roles = await this.rolesRepository.find({
            where: {
                id: In(uniqueRoleIds as any),
            },
        });

        const foundIds = roles.map((r) => Number(r.id));
        const missingIds = uniqueRoleIds.filter((id) => !foundIds.includes(id));

        if (missingIds.length > 0) {
            throw new BadRequestException(`Role không tồn tại: ${missingIds.join(', ')}`);
        }

        await this.dataSource.transaction(async (manager) => {
            // await manager.delete(UserRole, { userId });

            // if (uniqueRoleIds.length > 0) {
            //     const newMappings = uniqueRoleIds.map((roleId) =>
            //         manager.create(UserRole, {
            //             userId,
            //             roleId: String(roleId),
            //             assignedBy,
            //         }),
            //     );

            //     await manager.save(UserRole, newMappings);
            // }
            const existingMappings = await manager.find(UserRole, {
                where: { userId },
            });

            if (existingMappings.length > 0) {
                await manager.remove(UserRole, existingMappings);
            }

            if (uniqueRoleIds.length > 0) {
                const newMappings = uniqueRoleIds.map((roleId) =>
                    manager.create(UserRole, {
                        userId,
                        roleId: String(roleId),
                        assignedBy,
                    }),
                );

                await manager.save(UserRole, newMappings);
            }
        });

        return this.getUserRoles(userId);
    }

    async updateAvatar(userId: string, file: Express.Multer.File) {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) {
            throw new NotFoundException('Không tìm thấy người dùng');
        }

        if (!file) {
            throw new BadRequestException('Vui lòng chọn ảnh');
        }

        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('Chỉ hỗ trợ file jpg, jpeg, png, webp');
        }

        const maxSize = 2 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new BadRequestException('Ảnh tối đa 2MB');
        }

        if (user.avatarPublicId) {
            await this.cloudinaryService.deleteImage(user.avatarPublicId);
        }

        const uploaded = await this.cloudinaryService.uploadImage(file, 'users/avatar');

        user.avatarUrl = uploaded.url;
        user.avatarPublicId = uploaded.publicId;

        const saved = await this.userRepository.save(user);

        return this.sanitize(saved);
    }

    async removeAvatar(userId: string) {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) {
            throw new NotFoundException('Không tìm thấy người dùng');
        }

        if (user.avatarPublicId) {
            await this.cloudinaryService.deleteImage(user.avatarPublicId);
        }

        user.avatarUrl = '';
        user.avatarPublicId = '';

        const saved = await this.userRepository.save(user);

        return this.sanitize(saved);
    }

    async updateRefreshToken(userId: string, refreshToken: string | null) {
        const user = await this.userRepository.findOne({
            where: { id: userId } as any,
            select: ['id', 'refreshTokenHash'],
        });

        if (!user) {
            throw new NotFoundException('Không tìm thấy người dùng');
        }

        user.refreshTokenHash = refreshToken
            ? await bcrypt.hash(refreshToken, 10)
            : undefined;

        await this.userRepository.save(user);
    }

    async getUserWithRefreshToken(userId: string) {
        return this.userRepository.findOne({
            where: { id: userId } as any,
            select: [
                'id',
                'name',
                'email',
                'phone',
                'avatarUrl',
                'isVerified',
                'isActive',
                'createdAt',
                'updatedAt',
                'refreshTokenHash',
            ],
        });
    }

    async findByGoogleIdOrEmail(googleId: string, email: string) {
        return this.userRepository.findOne({
            where: [
                { googleId },
                { email },
            ],
        });
    }

    async createGoogleUser(payload: {
        googleId: string;
        email: string;
        name: string;
        avatarUrl?: string;
    }) {
        const user = this.userRepository.create({
            name: payload.name,
            email: payload.email,
            googleId: payload.googleId,
            avatarUrl: payload.avatarUrl,
            passwordHash: null,
            isVerified: true,
            isActive: true,
        });

        const savedUser = await this.userRepository.save(user);

        await this.assignDefaultCustomerRole(savedUser.id);

        return savedUser;
    }

    async saveUser(user: User) {
        return this.userRepository.save(user);
    }

    async assignDefaultCustomerRole(userId: string) {
        const customerRole = await this.rolesRepository.findOne({
            where: { code: 'customer' },
        });

        if (!customerRole) {
            throw new NotFoundException("Không tìm thấy role mặc định 'customer'");
        }

        const existed = await this.userRolesRepository.findOne({
            where: {
                userId,
                roleId: customerRole.id,
            },
        });

        if (existed) {
            return existed;
        }

        const userRole = this.userRolesRepository.create({
            userId,
            roleId: customerRole.id,
            assignedBy: undefined,
        });

        return this.userRolesRepository.save(userRole);
    }
}
