import { BaseEntity, PaginationQuery } from "./common";

export interface IPermission extends BaseEntity {
    id: string;
    code: string;
    name: string;
    module: string;
    description?: string;
    createdAt?: string;
}

export interface PermissionQueryParams extends PaginationQuery {
    module?: string;
}

export interface CreatePermissionPayload {
    code: string;
    name: string;
    module: string;
    description?: string;
}

export interface UpdatePermissionPayload
    extends Partial<CreatePermissionPayload> { }