import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PayOS } from '@payos/node';

@Injectable()
export class PayosClient {
    private readonly payOS: PayOS;

    constructor(private readonly configService: ConfigService) {
        const clientId = this.configService.get<string>('PAYOS_CLIENT_ID');
        const apiKey = this.configService.get<string>('PAYOS_API_KEY');
        const checksumKey = this.configService.get<string>('PAYOS_CHECKSUM_KEY');

        if (!clientId || !apiKey || !checksumKey) {
            throw new Error('Missing payOS configuration');
        }

        this.payOS = new PayOS({
            clientId,
            apiKey,
            checksumKey,
        });
    }

    createPaymentLink(payload: {
        orderCode: number;
        amount: number;
        description: string;
        items: {
            name: string;
            quantity: number;
            price: number;
        }[];
        returnUrl: string;
        cancelUrl: string;
    }) {
        return this.payOS.paymentRequests.create(payload);
    }

    verifyWebhook(body: any) {
        return this.payOS.webhooks.verify(body);
    }

    confirmWebhook(webhookUrl: string) {
        return this.payOS.webhooks.confirm(webhookUrl);
    }
}