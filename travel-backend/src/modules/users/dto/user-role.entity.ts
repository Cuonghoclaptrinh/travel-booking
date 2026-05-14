import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from 'src/modules/roles/entities/role.entity';

@Entity('user_roles')
export class UserRole {
    @PrimaryColumn({ name: 'user_id', type: 'bigint', unsigned: true })
    userId!: string;

    @PrimaryColumn({ name: 'role_id', type: 'bigint', unsigned: true })
    roleId!: string;

    @CreateDateColumn({ name: 'assigned_at', type: 'timestamp' })
    assignedAt!: Date;

    @Column({
        name: 'assigned_by',
        type: 'bigint',
        unsigned: true,
        nullable: true,
    })
    assignedBy?: string;

    @ManyToOne(() => User, (user) => user.userRoles, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ManyToOne(() => Role, (role) => role.userRoles, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'role_id' })
    role!: Role;

    @ManyToOne(() => User, (user) => user.assignedRoles, {
        onDelete: 'SET NULL',
        nullable: true,
    })
    @JoinColumn({ name: 'assigned_by' })
    assignedByUser?: User;
}