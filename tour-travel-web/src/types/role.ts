import { PaginationQuery } from "./common";
import { IPermission } from "./permission";

export interface IRole {
    id: string;
    code: string;
    name: string;
    description?: string;
    isSystem: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface RoleQueryParams extends PaginationQuery { }

export interface CreateRolePayload {
    code: string;
    name: string;
    description?: string;
    isSystem?: boolean;
}

export interface UpdateRolePayload extends Partial<CreateRolePayload> { }

export interface RolePermissionsResponse {
    role: {
        id: string;
        code: string;
        name: string;
    };
    permissions: IPermission[];
}

export interface AssignPermissionsPayload {
    permissionIds: number[];
}