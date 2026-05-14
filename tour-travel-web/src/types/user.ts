import { PaginationQuery } from "./common";
import { IRole } from "./role";

export interface IUser {
    id: string;
    name: string;
    email: string;
    phone?: string;
    isVerified: boolean;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string;
}

export interface UserQueryParams extends PaginationQuery { }

export interface CreateUserPayload {
    name: string;
    email: string;
    phone?: string;
    password: string;
}

export interface UpdateUserPayload extends Partial<CreateUserPayload> { }

export interface UserRolesResponse {
    user: {
        id: string;
        name: string;
        email: string;
    };
    roles: IRole[];
}

export interface AssignRolesPayload {
    roleIds: number[];
}