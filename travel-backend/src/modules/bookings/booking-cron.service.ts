import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource, LessThan } from 'typeorm';
import { Booking, BookingStatus, PaymentStatus } from './entities/booking.entity';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class BookingCronService {
    constructor(
        private dataSource: DataSource,
        private realtimeGateway: RealtimeGateway,
    ) { }

    // Chạy mỗi phút
    @Cron(CronExpression.EVERY_MINUTE)
    async expireBookings() {
        console.log('Cron job running: expireBookings', new Date().toISOString());
        const bookingRepo = this.dataSource.getRepository(Booking);
        const now = new Date();

        const expiredBookings = await bookingRepo.find({
            where: {
                bookingStatus: BookingStatus.PENDING_PAYMENT,
                expiresAt: LessThan(now),
            },
        });

        for (const booking of expiredBookings) {
            booking.bookingStatus = BookingStatus.EXPIRED;
            booking.paymentStatus = PaymentStatus.EXPIRED;
            await bookingRepo.save(booking);

            // Emit socket realtime cho user
            this.realtimeGateway.emitBookingUpdatedToUser(booking.userId, {
                bookingId: booking.id,
                bookingCode: booking.code,
                bookingStatus: booking.bookingStatus,
                paymentStatus: booking.paymentStatus,
                message: 'Booking expired due to non-payment',
            });

            // Emit socket update slots nếu cần
            this.realtimeGateway.emitDepartureSlotsUpdated(booking.departureId, {
                departureId: booking.departureId,
                message: 'Departure slots updated after booking expired',
            });
        }
    }
}