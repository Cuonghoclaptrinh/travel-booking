import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { VnpayController } from './vnpay.controller';
import { AdminPaymentsController } from './admin-payments.controller';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { MailModule } from '../mail/mail.module';
import { PayosClient } from './payos.client';
import { PayosController } from './payos.controller';

@Module({
  imports: [
    ConfigModule,
    MailModule,
    TypeOrmModule.forFeature([PaymentTransaction, Booking]),
  ],
  controllers: [PaymentsController, VnpayController, AdminPaymentsController, PayosController],
  providers: [PaymentsService, RealtimeGateway, PayosClient],
  exports: [PaymentsService, RealtimeGateway],
})
export class PaymentsModule { }
