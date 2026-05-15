import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments/payos')
export class PayosController {
    payosClient: any;
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post('webhook')
    @HttpCode(200)
    async handleWebhook(@Body() body: any) {
        console.log('PAYOS WEBHOOK:', JSON.stringify(body, null, 2));

        try {
            await this.paymentsService.handlePayosWebhook(body);

            return {
                success: true,
                message: 'Webhook processed',
            };
        } catch (error) {
            console.error('PAYOS WEBHOOK ERROR:', error);

            return {
                success: false,
                message: error || 'Invalid webhook',
            };
        }
    }

    @Post('confirm-webhook')
    async confirmWebhook(@Body('webhookUrl') webhookUrl: string) {
        return this.payosClient.confirmWebhook(webhookUrl);
    }
}