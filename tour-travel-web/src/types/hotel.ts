import { IAmenity } from "./amenity";
import { IDestination } from "./destination";

export interface IHotel {
    id: number;
    destinationId: number;
    destination?: IDestination;
    name: string;
    address?: string | null;
    starRating?: string | null;
    latitude?: string | null;
    longitude?: string | null;
    contactPhone?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface HotelQueryParams {
    search?: string;
    destinationId?: number;
    starRating?: number;
    sortBy?: "id" | "name" | "starRating" | "createdAt";
    sortOrder?: "ASC" | "DESC" | "asc" | "desc";
    page?: number;
    limit?: number;
}

export interface CreateHotelPayload {
    destinationId: number;
    name: string;
    address?: string;
    starRating?: number;
    latitude?: number;
    longitude?: number;
    contactPhone?: string;
}

export interface UpdateHotelPayload extends Partial<CreateHotelPayload> { }

export interface IHotelImage {
    id: number;
    hotelId: number;
    url: string;
    publicId: string;
    isDefault: boolean;
    createdAt?: string;
}

export interface IHotelAmenity {
    hotelId: number;
    amenityId: number;
    amenity: IAmenity;
}

export interface ReplaceHotelAmenitiesPayload {
    amenityIds: number[];
}