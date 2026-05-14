import { IUser } from "../types/auth";

type RawUser = Partial<IUser> & {
    permission?: string[];
    permissions?: string[];
    roles?: string[];
};

export const ADMIN_ROLES = ["admin", "super_admin", "staff"];

export const ADMIN_PERMISSIONS = [
    "user.view",
    "role.view",
    "permission.view",
    "destination.view",
    "amenity.view",
    "hotel.view",
    "tour.view",
];

export const normalizeUser = (user: RawUser | null | undefined): IUser => {
    const roles = Array.isArray(user?.roles) ? user.roles : [];
    const permissions = Array.isArray(user?.permissions)
        ? user.permissions
        : Array.isArray(user?.permission)
            ? user.permission
            : [];

    return {
        id: user?.id ?? "",
        name: user?.name ?? "",
        email: user?.email ?? "",
        roles,
        permissions,
        ...(user?.phone !== undefined ? { phone: user.phone } : {}),
        ...(user?.avatarUrl !== undefined ? { avatarUrl: user.avatarUrl } : {}),
        ...(user?.isVerified !== undefined ? { isVerified: user.isVerified } : {}),
        ...(user?.isActive !== undefined ? { isActive: user.isActive } : {}),
        ...(user?.createdAt !== undefined ? { createdAt: user.createdAt } : {}),
        ...(user?.updatedAt !== undefined ? { updatedAt: user.updatedAt } : {}),
    };
};

export const hasRole = (user: IUser | null, role: string): boolean => {
    return !!user?.roles?.some(
        (item) => item.toLowerCase() === role.toLowerCase()
    );
};

export const hasAnyRole = (user: IUser | null, roles: string[] = []): boolean => {
    return roles.some((role) => hasRole(user, role));
};

export const hasPermission = (
    user: IUser | null,
    permission: string
): boolean => {
    return !!user?.permissions?.includes(permission);
};

export const hasAnyPermission = (
    user: IUser | null,
    permissions: string[] = []
): boolean => {
    return permissions.some((permission) => hasPermission(user, permission));
};

export const hasAllPermissions = (
    user: IUser | null,
    permissions: string[] = []
): boolean => {
    return permissions.every((permission) => hasPermission(user, permission));
};

export const canAccessAdmin = (user: IUser | null): boolean => {
    return (
        hasAnyRole(user, ADMIN_ROLES) ||
        hasAnyPermission(user, ADMIN_PERMISSIONS)
    );
};
