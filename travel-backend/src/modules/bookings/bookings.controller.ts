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
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { CreateBookingDto } from './dto/create-booking.dto';
import { QueryMyBookingsDto } from './dto/query-my-bookings.dto';
import { PayBookingDto } from './dto/pay-booking.dto';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { Permissions } from '../access-control/decorators/permissions.decorator';

@Controller('bookings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BookingsController {
    constructor(private readonly bookingsService: BookingsService) { }

    @Post()
    @Permissions('booking.create')
    create(
        @CurrentUser() user: { userId: number; email: string; name: string },
        @Body() dto: CreateBookingDto,
    ) {
        return this.bookingsService.create(user, dto);
    }

    @Get('my')
    @Permissions('booking.my.view')
    getMyBookings(
        @CurrentUser() user: { userId: number },
        @Query() query: QueryMyBookingsDto,
    ) {
        return this.bookingsService.getMyBookings(user.userId, query);
    }

    @Get('my/:id')
    @Permissions('booking.my.view')
    getMyBookingById(
        @CurrentUser() user: { userId: number },
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.bookingsService.getMyBookingById(user.userId, id);
    }

    @Post('my/:id/pay')
    @Permissions('booking.my.pay')
    pay(
        @CurrentUser() user: { userId: number },
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: PayBookingDto,
    ) {
        return this.bookingsService.pay(user.userId, id, dto);
    }

    @Post('my/:id/cancel')
    @Permissions('booking.my.cancel')
    cancel(
        @CurrentUser() user: { userId: number },
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.bookingsService.cancel(user.userId, id);
    }
}