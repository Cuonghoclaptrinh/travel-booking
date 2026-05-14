import { IsIn, IsOptional, IsString } from 'class-validator';

export type DashboardRange =
    | 'today'
    | '7d'
    | '30d'
    | 'this_month'
    | 'last_month'
    | '3m'
    | '6m'
    | 'this_year'
    | 'custom';

export class DashboardQueryDto {
    @IsOptional()
    @IsIn([
        'today',
        '7d',
        '30d',
        'this_month',
        'last_month',
        '3m',
        '6m',
        'this_year',
        'custom',
    ])
    range?: DashboardRange = '7d';

    @IsOptional()
    @IsString()
    from?: string;

    @IsOptional()
    @IsString()
    to?: string;
}