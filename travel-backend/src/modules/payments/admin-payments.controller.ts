import {
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Query,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { Permissions } from '../access-control/decorators/permissions.decorator';
import { PaymentsService } from './payments.service';
import { AdminQueryPaymentsDto } from './dto/admin-query-payments.dto';

@Controller('admin/payments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminPaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Get()
    @Permissions('payment.admin.view')
    getPayments(@Query() query: AdminQueryPaymentsDto) {
        return this.paymentsService.getAdminPayments(query);
    }

    @Get('booking/:bookingId')
    @Permissions('payment.admin.view')
    getPaymentsByBookingForAdmin(
        @Param('bookingId', ParseIntPipe) bookingId: number,
    ) {
        return this.paymentsService.getPaymentsByBookingForAdmin(bookingId);
    }

    @Get(':id')
    @Permissions('payment.admin.view')
    getPaymentById(@Param('id', ParseIntPipe) id: number) {
        return this.paymentsService.getAdminPaymentById(id);
    }


}