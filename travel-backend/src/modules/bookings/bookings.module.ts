import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { User } from '../users/entities/user.entity';
import { Tour } from '../tours/entities/tour.entity';
import { TourPackage } from '../tours/entities/tour-package.entity';
import { TourDeparture } from '../tours/entities/tour-departure.entity';
import { DepartureOption } from '../tours/entities/departure-option.entity';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { AdminBookingsController } from './admin-bookings.controller';
import { AdminBookingOverviewController } from './admin-booking-overview.controller';
import { PaymentTransaction } from '../payments/entities/payment-transaction.entity';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { RealtimeModule } from '../realtime/realtime.module';
import { BookingCronService } from './booking-cron.service';
import { MailModule } from '../mail/mail.module';
@Module({
    imports: [
        TypeOrmModule.forFeature([
            Booking,
            User,
            Tour,
            TourPackage,
            TourDeparture,
            DepartureOption,
            PaymentTransaction,
        ]),
        MailModule,
        RealtimeModule
    ],
    controllers: [BookingsController, AdminBookingsController, AdminBookingOverviewController,],
    providers: [BookingsService, PermissionsGuard, RealtimeGateway, BookingCronService],
    exports: [BookingsService, RealtimeGateway],
})
export class BookingsModule { }
