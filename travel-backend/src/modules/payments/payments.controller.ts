import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { type Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { CreateVnpayPaymentUrlDto } from './dto/create-vnpay-payment-url.dto';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { Permissions } from '../access-control/decorators/permissions.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PaymentsController {
    payosClient: any;
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post('bookings/:bookingId/vnpay/create-url')
    @Permissions('booking.my.pay')
    createVnpayPaymentUrl(
        @CurrentUser() user: { userId: number },
        @Param('bookingId', ParseIntPipe) bookingId: number,
        @Body() dto: CreateVnpayPaymentUrlDto,
        @Req() req: Request,
    ) {
        const ipAddr =
            (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
            req.socket.remoteAddress ||
            '127.0.0.1';

        return this.paymentsService.createVnpayPaymentUrl(
            user.userId,
            bookingId,
            dto,
            ipAddr,
        );
    }

    @Get('bookings/:bookingId')
    @Permissions('booking.my.view')
    getPaymentsByBooking(
        @CurrentUser() user: { userId: number },
        @Param('bookingId', ParseIntPipe) bookingId: number,
    ) {
        return this.paymentsService.getPaymentsByBooking(user.userId, bookingId);
    }

    @Post('bookings/:bookingId/payos/create-url')
    @Permissions('booking.my.pay')
    createPayosPaymentUrl(
        @CurrentUser() user: { userId: number },
        @Param('bookingId', ParseIntPipe) bookingId: number,
    ) {
        return this.paymentsService.createPayosPaymentUrl(
            user.userId,
            bookingId,
        );
    }


    @Post('bookings/:bookingId/mock-payos/create-url')
    @Permissions('booking.my.pay')
    createMockPayosPaymentUrl(
        @CurrentUser() user: { userId: number },
        @Param('bookingId', ParseIntPipe) bookingId: number,
    ) {
        return this.paymentsService.createMockPayosPaymentUrl(
            user.userId,
            bookingId,
        );
    }

    @Post('mock-payos/:transactionRef/confirm')
    @Permissions('booking.my.pay')
    confirmMockPayosPayment(
        @Param('transactionRef') transactionRef: string,
    ) {
        return this.paymentsService.confirmMockPayosPayment(transactionRef);
    }
}