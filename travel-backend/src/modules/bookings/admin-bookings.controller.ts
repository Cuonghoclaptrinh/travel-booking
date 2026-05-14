import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookingsService } from './bookings.service';
// import { AdminGuard } from './guards/admin.guard';
import { AdminQueryBookingsDto } from './dto/admin-query-bookings.dto';
import { AdminConfirmPaymentDto } from './dto/admin-confirm-payment.dto';
import { AdminCancelBookingDto } from './dto/admin-cancel-booking.dto';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { Permissions } from '../access-control/decorators/permissions.decorator';

@Controller('admin/bookings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminBookingsController {
    constructor(private readonly bookingsService: BookingsService) { }

    @Get()
    @Permissions('booking.admin.view')
    getBookings(@Query() query: AdminQueryBookingsDto) {
        return this.bookingsService.getAdminBookings(query);
    }

    @Get(':id')
    @Permissions('booking.admin.view')
    getBookingById(@Param('id', ParseIntPipe) id: number) {
        return this.bookingsService.getAdminBookingById(id);
    }

    @Post(':id/confirm-payment')
    @Permissions('booking.admin.confirm_payment')
    confirmPayment(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: AdminConfirmPaymentDto,
    ) {
        return this.bookingsService.confirmPaymentByAdmin(id, dto);
    }

    @Post(':id/cancel')
    @Permissions('booking.admin.cancel')
    cancel(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: AdminCancelBookingDto,
    ) {
        return this.bookingsService.cancelByAdmin(id, dto);
    }

    @Post(':id/expire')
    @Permissions('booking.admin.expire')
    expire(@Param('id', ParseIntPipe) id: number) {
        return this.bookingsService.expireBookingByAdmin(id);
    }
}