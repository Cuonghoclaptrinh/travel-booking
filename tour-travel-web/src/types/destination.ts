export type DestinationRegion =
    | "NORTH"
    | "CENTRAL"
    | "SOUTH"
    | "HIGHLANDS"
    | "INTERNATIONAL";

export type DestinationType =
    | "BEACH"
    | "ISLAND"
    | "MOUNTAIN"
    | "CITY"
    | "HERITAGE"
    | "RIVER";

export const destinationRegionOptions: {
    label: string;
    value: DestinationRegion;
}[] = [
        { label: "Miền Bắc", value: "NORTH" },
        { label: "Miền Trung", value: "CENTRAL" },
        { label: "Miền Nam", value: "SOUTH" },
        { label: "Tây Nguyên", value: "HIGHLANDS" },
        { label: "Nước ngoài", value: "INTERNATIONAL" },
    ];

export const destinationTypeOptions: {
    label: string;
    value: DestinationType;
}[] = [
        { label: "Biển", value: "BEACH" },
        { label: "Đảo", value: "ISLAND" },
        { label: "Núi", value: "MOUNTAIN" },
        { label: "Thành phố", value: "CITY" },
        { label: "Di sản", value: "HERITAGE" },
        { label: "Sông nước", value: "RIVER" },
    ];

export const destinationRegionLabel: Record<DestinationRegion, string> = {
    NORTH: "Miền Bắc",
    CENTRAL: "Miền Trung",
    SOUTH: "Miền Nam",
    HIGHLANDS: "Tây Nguyên",
    INTERNATIONAL: "Nước ngoài",
};

export const destinationTypeLabel: Record<DestinationType, string> = {
    BEACH: "Biển",
    ISLAND: "Đảo",
    MOUNTAIN: "Núi",
    CITY: "Thành phố",
    HERITAGE: "Di sản",
    RIVER: "Sông nước",
};

export interface IDestination {
    id: number;
    name: string;
    country?: string;
    slug: string;
    description?: string;

    region?: DestinationRegion;
    destinationType?: DestinationType;
    isFeatured?: boolean;
    displayOrder?: number;

    defaultImageUrl?: string | null;
    images?: IDestinationImage[];

    latitude?: string | number | null;
    longitude?: string | number | null;
    mapAddress?: string | null;
}

export interface DestinationQueryParams {
    search?: string;
    region?: DestinationRegion;
    destinationType?: DestinationType;
    isFeatured?: boolean;
    page?: number;
    limit?: number;
}

export interface CreateDestinationPayload {
    name: string;
    country?: string;
    slug?: string;
    description?: string;

    region?: DestinationRegion;
    destinationType?: DestinationType;
    isFeatured?: boolean;
    displayOrder?: number;

    latitude?: string | number | null;
    longitude?: string | number | null;
    mapAddress?: string | null;
}

export interface UpdateDestinationPayload
    extends Partial<CreateDestinationPayload> { }

export interface IDestinationImage {
    id: number;
    destinationId: number;
    url: string;
    publicId: string;
    isDefault: boolean;
    createdAt?: string;
}

export interface UploadDestinationImagePayload {
    file: File;
    isDefault?: boolean;
}