export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface PaginationQuery {
    page?: number;
    limit?: number;
    keyword?: string;
}

export interface BaseEntity {
    id: string | number;
    createdAt?: string;
    updatedAt?: string;
}

export interface SelectOption<T = string | number> {
    label: string;
    value: T;
}