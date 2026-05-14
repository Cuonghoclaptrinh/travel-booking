import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { Permissions } from '../access-control/decorators/permissions.decorator';
import { BookingsService } from './bookings.service';
import { QueryAdminTourBookingOverviewDto } from './dto/query-admin-tour-booking-overview.dto';

@Controller('admin/bookings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminBookingOverviewController {
    constructor(private readonly bookingsService: BookingsService) { }

    @Get('overview/tours')
    @Permissions('booking.admin.view')
    async getTourOverview(@Query() query: QueryAdminTourBookingOverviewDto) {
        return this.bookingsService.getAdminTourOverview(query);
    }

    @Get('tours/:tourId/departures')
    @Permissions('booking.admin.view')
    async getTourDepartures(
        @Param('tourId', ParseIntPipe) tourId: number,
    ) {
        return this.bookingsService.getAdminTourDepartures(tourId);
    }

    @Get('departures/:departureId/bookings')
    @Permissions('booking.admin.view')
    async getDepartureBookings(
        @Param('departureId', ParseIntPipe) departureId: number,
    ) {
        return this.bookingsService.getAdminDepartureBookings(departureId);
    }
}