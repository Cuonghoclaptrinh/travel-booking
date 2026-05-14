import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Tour } from '../tours/entities/tour.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { TourDeparture } from '../tours/entities/tour-departure.entity';
import { BookingStatus } from '../bookings/entities/booking.entity';
import { PaymentStatus } from '../bookings/entities/booking.entity';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(Tour)
        private readonly tourRepository: Repository<Tour>,

        @InjectRepository(Booking)
        private readonly bookingRepository: Repository<Booking>,

        @InjectRepository(TourDeparture)
        private readonly departureRepository: Repository<TourDeparture>,
    ) { }

    async getOverview(query: DashboardQueryDto) {
        const dateRange = this.resolveDateRange(query);

        const [
            stats,
            revenueByDay,
            actionItems,
            upcomingDepartures,
            topToursByRevenue,
        ] = await Promise.all([
            this.getStats(dateRange),
            this.getRevenueByDay(dateRange),
            this.getActionItems(),
            this.getUpcomingDepartures(),
            this.getTopToursByRevenue(dateRange),
        ]);

        return {
            range: {
                type: query.range || '7d',
                from: dateRange.from,
                to: dateRange.to,
            },
            stats,
            revenueByDay,
            revenueLast7Days: revenueByDay, // giữ lại key cũ để FE chưa vỡ
            actionItems,
            upcomingDepartures,
            topToursByRevenue,
        };
    }

    private resolveDateRange(query: DashboardQueryDto) {
        const range = query.range || '7d';

        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);

        let from = new Date(startOfToday);
        let to = new Date(endOfToday);

        switch (range) {
            case 'today':
                from = startOfToday;
                to = endOfToday;
                break;

            case '7d':
                from = new Date(startOfToday);
                from.setDate(from.getDate() - 6);
                to = endOfToday;
                break;

            case '30d':
                from = new Date(startOfToday);
                from.setDate(from.getDate() - 29);
                to = endOfToday;
                break;

            case 'this_month':
                from = new Date(now.getFullYear(), now.getMonth(), 1);
                to = endOfToday;
                break;

            case 'last_month':
                from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                to = new Date(now.getFullYear(), now.getMonth(), 0);
                to.setHours(23, 59, 59, 999);
                break;

            case '3m':
                from = new Date(startOfToday);
                from.setMonth(from.getMonth() - 3);
                to = endOfToday;
                break;

            case '6m':
                from = new Date(startOfToday);
                from.setMonth(from.getMonth() - 6);
                to = endOfToday;
                break;

            case 'this_year':
                from = new Date(now.getFullYear(), 0, 1);
                to = endOfToday;
                break;

            case 'custom':
                if (query.from) {
                    from = new Date(query.from);
                    from.setHours(0, 0, 0, 0);
                }

                if (query.to) {
                    to = new Date(query.to);
                    to.setHours(23, 59, 59, 999);
                }
                break;

            default:
                from = new Date(startOfToday);
                from.setDate(from.getDate() - 6);
                to = endOfToday;
                break;
        }

        return { from, to };
    }

    private async getStats(dateRange: { from: Date; to: Date }) {
        const [
            totalUsers,
            totalTours,
            totalBookings,
            paidBookings,
            pendingPaymentBookings,
            expiredBookings,
            cancelledBookings,
            revenueResult,
        ] = await Promise.all([
            this.userRepository.count(),

            this.tourRepository.count(),

            this.bookingRepository
                .createQueryBuilder('booking')
                .where('booking.created_at BETWEEN :from AND :to', dateRange)
                .getCount(),

            this.bookingRepository
                .createQueryBuilder('booking')
                .where('booking.payment_status = :paymentStatus', {
                    paymentStatus: PaymentStatus.PAID,
                })
                .andWhere('booking.paid_at BETWEEN :from AND :to', dateRange)
                .getCount(),

            this.bookingRepository
                .createQueryBuilder('booking')
                .where('booking.booking_status = :bookingStatus', {
                    bookingStatus: BookingStatus.PENDING_PAYMENT,
                })
                .andWhere('booking.payment_status = :paymentStatus', {
                    paymentStatus: PaymentStatus.UNPAID,
                })
                .andWhere('booking.created_at BETWEEN :from AND :to', dateRange)
                .getCount(),

            this.bookingRepository
                .createQueryBuilder('booking')
                .where('booking.booking_status = :bookingStatus', {
                    bookingStatus: BookingStatus.EXPIRED,
                })
                .andWhere('booking.created_at BETWEEN :from AND :to', dateRange)
                .getCount(),

            this.bookingRepository
                .createQueryBuilder('booking')
                .where('booking.booking_status = :bookingStatus', {
                    bookingStatus: BookingStatus.CANCELLED,
                })
                .andWhere('booking.created_at BETWEEN :from AND :to', dateRange)
                .getCount(),

            this.bookingRepository
                .createQueryBuilder('booking')
                .select('COALESCE(SUM(booking.total_amount), 0)', 'totalRevenue')
                .where('booking.payment_status = :paymentStatus', {
                    paymentStatus: PaymentStatus.PAID,
                })
                .andWhere('booking.paid_at BETWEEN :from AND :to', dateRange)
                .getRawOne(),
        ]);

        return {
            totalUsers,
            totalTours,
            totalBookings,
            totalRevenue: Number(revenueResult?.totalRevenue || 0),
            paidBookings,
            pendingPaymentBookings,
            expiredBookings,
            cancelledBookings,
        };
    }

    private async getRevenueByDay(dateRange: { from: Date; to: Date }) {
        const rows = await this.bookingRepository
            .createQueryBuilder('booking')
            .select('DATE(booking.paid_at)', 'date')
            .addSelect('COALESCE(SUM(booking.total_amount), 0)', 'revenue')
            .addSelect('COUNT(*)', 'bookingCount')
            .where('booking.payment_status = :paymentStatus', {
                paymentStatus: PaymentStatus.PAID,
            })
            .andWhere('booking.paid_at BETWEEN :from AND :to', dateRange)
            .groupBy('DATE(booking.paid_at)')
            .orderBy('date', 'ASC')
            .getRawMany();

        const map = new Map<string, { revenue: number; bookingCount: number }>();

        rows.forEach((row) => {
            const key =
                row.date instanceof Date
                    ? row.date.toISOString().slice(0, 10)
                    : String(row.date).slice(0, 10);

            map.set(key, {
                revenue: Number(row.revenue || 0),
                bookingCount: Number(row.bookingCount || 0),
            });
        });

        const result: {
            date: string;
            revenue: number;
            bookingCount: number;
        }[] = [];

        const cursor = new Date(dateRange.from);
        cursor.setHours(0, 0, 0, 0);

        const end = new Date(dateRange.to);
        end.setHours(0, 0, 0, 0);

        while (cursor <= end) {
            const key = cursor.toISOString().slice(0, 10);
            const value = map.get(key);

            result.push({
                date: key,
                revenue: value?.revenue || 0,
                bookingCount: value?.bookingCount || 0,
            });

            cursor.setDate(cursor.getDate() + 1);
        }

        return result;
    }

    private async getActionItems() {
        const bookings = await this.bookingRepository.find({
            where: {
                bookingStatus: BookingStatus.PENDING_PAYMENT,
                paymentStatus: PaymentStatus.UNPAID,
            },
            relations: {
                tour: true,
            },
            order: {
                expiresAt: 'ASC',
            },
            take: 10,
        });

        return bookings.map((booking) => ({
            id: booking.id,
            code: booking.code,
            contactName: booking.contactName,
            contactEmail: booking.contactEmail,
            contactPhone: booking.contactPhone,
            tourName: booking.tour?.name || null,
            totalAmount: Number(booking.totalAmount || 0),
            paymentMethod: booking.paymentMethod || null,
            bookingStatus: booking.bookingStatus,
            paymentStatus: booking.paymentStatus,
            expiresAt: booking.expiresAt,
            createdAt: booking.createdAt,
        }));
    }

    private async getUpcomingDepartures() {
        const now = new Date();

        const next14Days = new Date();
        next14Days.setDate(next14Days.getDate() + 14);

        const departures = await this.departureRepository.find({
            where: {
                departureDate: Between(now, next14Days),
            },
            relations: {
                tour: true,
            },
            order: {
                departureDate: 'ASC',
            },
            take: 10,
        });

        return departures.map((departure) => {
            const capacity = Number(departure.capacity || 0);
            const bookedSlots = Number(departure.bookedSlots || 0);
            const availableSlots = Math.max(0, capacity - bookedSlots);

            return {
                departureId: departure.id,
                tourId: departure.tourId,
                tourName: departure.tour?.name || null,
                code: departure.code,
                departureDate: departure.departureDate,
                returnDate: departure.returnDate,
                capacity,
                bookedSlots,
                availableSlots,
                status: departure.status,
            };
        });
    }

    private async getTopToursByRevenue(dateRange: { from: Date; to: Date }) {
        const rows = await this.bookingRepository
            .createQueryBuilder('booking')
            .leftJoin('booking.tour', 'tour')
            .select('tour.id', 'tourId')
            .addSelect('tour.name', 'tourName')
            .addSelect('COUNT(booking.id)', 'bookingCount')
            .addSelect('COALESCE(SUM(booking.reserved_slots), 0)', 'guestCount')
            .addSelect('COALESCE(SUM(booking.total_amount), 0)', 'revenue')
            .where('booking.payment_status = :paymentStatus', {
                paymentStatus: PaymentStatus.PAID,
            })
            .andWhere('booking.paid_at BETWEEN :from AND :to', dateRange)
            .groupBy('tour.id')
            .addGroupBy('tour.name')
            .orderBy('revenue', 'DESC')
            .limit(5)
            .getRawMany();

        return rows.map((row) => ({
            tourId: row.tourId,
            tourName: row.tourName,
            bookingCount: Number(row.bookingCount || 0),
            guestCount: Number(row.guestCount || 0),
            revenue: Number(row.revenue || 0),
        }));
    }
}