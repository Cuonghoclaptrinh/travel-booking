export type TourStatus = 'draft' | 'published' | 'closed';

export type TourSortBy = 'default' | 'newest';

export interface Tour {
    id: number;
    destinationId: number;
    name: string;
    slug: string;
    shortDescription?: string;
    description?: string;
    durationDays: number;
    durationNights: number;
    // coverImageUrl?: string;
    highlights?: string;
    includedServices?: string;
    excludedServices?: string;
    termsAndConditions?: string;
    status: TourStatus;
    createdAt?: string;
    updatedAt?: string;
    activePackageCount?: number;
    openDepartureCount?: number;
    packages?: TourPackage[];
    departures?: TourDeparture[];
    priceFrom?: string | null;
    priceChildFrom?: string | null;
    defaultPackageName?: string | null;
    upcomingDepartures?: TourDeparture[];
    tourType?: string | null;
    featureTags?: string[] | null;
    images?: TourImage[];
    isFeatured?: boolean | number;
    isHotDeal?: boolean | number;
    minOriginalPrice?: string | number | null;
    minSalePrice?: string | number | null;
    discountPercent?: number;
    destination?: IDestination | null | undefined;
}

export interface TourQueryParams {
    search?: string;
    destinationId?: number;
    status?: TourStatus;
    page?: number;
    limit?: number;
    priceMin?: number;
    priceMax?: number;

    durationMin?: number;
    durationMax?: number;

    departureFrom?: string;
    departureTo?: string;

    tourType?: string;
    feature?: string;

    isFeatured?: boolean;
    isHotDeal?: boolean;
}

export interface TourPagingResponse {
    items: Tour[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface CreateTourPayload {
    destinationId: number;
    name: string;
    slug?: string;
    shortDescription?: string;
    description?: string;
    durationDays: number;
    durationNights: number;
    coverImageUrl?: string;
    highlights?: string;
    includedServices?: string;
    excludedServices?: string;
    termsAndConditions?: string;
    tourType?: string;
    featureTags?: string[];
    isFeatured?: boolean;
    isHotDeal?: boolean;
}

import type { TourPackage } from './tour-package';
import type { TourDeparture } from './tour-departure';
import { IDestination } from './destination';

export const tourTypeOptions = [
    { label: 'Tour tiết kiệm', value: 'budget' },
    { label: 'Tour tiêu chuẩn', value: 'standard' },
    { label: 'Tour cao cấp', value: 'premium' },
    { label: 'Tour gia đình', value: 'family' },
    { label: 'Tour riêng / private', value: 'private' },
];

export const featureOptions = [
    { label: 'Biển đảo', value: 'beach' },
    { label: 'Nghỉ dưỡng', value: 'resort' },
    { label: 'Khám phá', value: 'explore' },
    { label: 'Văn hóa', value: 'culture' },
    { label: 'Mạo hiểm', value: 'adventure' },
    { label: 'Team building', value: 'team-building' },
];

export interface TourImage {
    id: number;
    tourId: number;
    url: string;
    publicId?: string;
    isDefault: boolean;
    sortOrder: number;
    createdAt?: string;
}