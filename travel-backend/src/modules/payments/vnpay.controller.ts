import { Controller, Get, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments/vnpay')
export class VnpayController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Get('ipn')
    handleIpn(@Query() query: Record<string, any>) {
        return this.paymentsService.handleVnpayIpn(query);
    }

    @Get('return')
    handleReturn(@Query() query: Record<string, any>) {
        return this.paymentsService.verifyVnpayReturn(query);
    }
}