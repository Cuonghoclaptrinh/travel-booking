export interface IAmenity {
    id: number;
    name: string;
}

export interface AmenityQueryParams {
    search?: string;
    page?: number;
    limit?: number;
}

export interface CreateAmenityPayload {
    name: string;
}

export interface UpdateAmenityPayload extends Partial<CreateAmenityPayload> { }