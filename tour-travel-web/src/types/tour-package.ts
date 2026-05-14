export type TourPackageStatus = 'active' | 'inactive';

export interface TourPackage {
    id: number;
    tourId: number;
    name: string;
    code: string;
    description?: string;
    priceAdult: string;
    priceChild: string;
    hotelName?: string;
    hotelStandard?: string;
    hotelAddress?: string;
    hotelDescription?: string;
    roomType?: string;
    mealsIncluded?: string;
    allowGuideOption: boolean;
    guideExtraPrice: string;
    isDefault: boolean;
    sortOrder: number;
    status: TourPackageStatus;
    discountPercent?: number;
}