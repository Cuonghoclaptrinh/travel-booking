import { Body, Controller, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments/payos')
export class PayosController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post('webhook')
    handleWebhook(@Body() body: any) {
        return this.paymentsService.handlePayosWebhook(body);
    }
}