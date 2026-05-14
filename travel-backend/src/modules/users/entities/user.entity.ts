import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    OneToMany,
} from 'typeorm';
import { UserRole } from 'src/modules/roles/entities/user-role.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: string;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email!: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    phone?: string;

    @Column({ name: 'password_hash', type: 'varchar', length: 255, select: false, nullable: true, })
    passwordHash!: string | null;

    @Column({ name: 'avatar_url', type: 'varchar', length: 1024, nullable: true })
    avatarUrl?: string;

    @Column({ name: 'avatar_public_id', type: 'varchar', length: 255, nullable: true })
    avatarPublicId?: string;

    @Column({ name: 'is_verified', type: 'tinyint', width: 1, default: 0 })
    isVerified!: boolean;

    @Column({ name: 'is_active', type: 'tinyint', width: 1, default: 1 })
    isActive!: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt!: Date;

    @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
    deletedAt?: Date;

    @OneToMany(() => UserRole, (userRole) => userRole.user)
    userRoles!: UserRole[];

    @OneToMany(() => UserRole, (userRole) => userRole.assignedByUser)
    assignedRoles!: UserRole[];

    @Column({ name: 'refresh_token_hash', type: 'varchar', length: 255, nullable: true, select: false, })
    refreshTokenHash?: string;

    @Column({
        name: 'google_id',
        type: 'varchar',
        length: 100,
        nullable: true,
        unique: true,
    })
    googleId?: string | null;

}