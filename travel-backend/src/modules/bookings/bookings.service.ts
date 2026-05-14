
import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    Brackets,
    DataSource,
    EntityManager,
    In,
    LessThan,
    MoreThan,
    Repository,
} from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

import { Booking } from './entities/booking.entity';
import { User } from '../users/entities/user.entity';
import { Tour } from '../tours/entities/tour.entity';
import { TourPackage } from '../tours/entities/tour-package.entity';
import { TourDeparture } from '../tours/entities/tour-departure.entity';
import { DepartureOption } from '../tours/entities/departure-option.entity';

import { CreateBookingDto } from './dto/create-booking.dto';
import { QueryMyBookingsDto } from './dto/query-my-bookings.dto';
import { PayBookingDto } from './dto/pay-booking.dto';
import { AdminQueryBookingsDto } from './dto/admin-query-bookings.dto';
import { AdminConfirmPaymentDto } from './dto/admin-confirm-payment.dto';
import { AdminCancelBookingDto } from './dto/admin-cancel-booking.dto';

import { BookingStatus, PaymentMethod, PaymentStatus } from './booking.enums';
import { PaymentTransaction } from '../payments/entities/payment-transaction.entity';
import { QueryAdminTourBookingOverviewDto } from './dto/query-admin-tour-booking-overview.dto';
import { PaymentTransactionStatus } from '../payments/payment.enums';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { TourDepartureStatus } from '../tours/tour.enums';
import { MailService } from '../mail/mail.service';

@Injectable()
export class BookingsService {
    private static readonly PAYMENT_EXPIRE_MINUTES = 2;
    private static readonly PRIVATE_GUIDE_FLAT_FEE = 500000;

    constructor(
        @InjectRepository(Booking)
        private readonly bookingRepository: Repository<Booking>,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(Tour)
        private readonly tourRepository: Repository<Tour>,

        @InjectRepository(TourPackage)
        private readonly packageRepository: Repository<TourPackage>,

        @InjectRepository(TourDeparture)
        private readonly departureRepository: Repository<TourDeparture>,

        @InjectRepository(DepartureOption)
        private readonly optionRepository: Repository<DepartureOption>,

        @InjectRepository(PaymentTransaction)
        private readonly paymentTransactionRepository: Repository<PaymentTransaction>,

        @InjectRepository(TourDeparture)
        private readonly tourDepartureRepository: Repository<TourDeparture>,

        private readonly dataSource: DataSource,

        private readonly realtimeGateway: RealtimeGateway,

        private readonly mailService: MailService,
    ) { }

    async create(
        user: { userId: number; email: string; name: string },
        dto: CreateBookingDto,
    ) {
        return this.dataSource.transaction(async (manager) => {
            const now = new Date();

            const bookingRepo = manager.getRepository(Booking);
            const tourRepo = manager.getRepository(Tour);
            const packageRepo = manager.getRepository(TourPackage);
            const departureRepo = manager.getRepository(TourDeparture);
            const optionRepo = manager.getRepository(DepartureOption);

            const tour = await tourRepo.findOne({
                where: { id: dto.tourId } as any,
            });
            if (!tour) throw new NotFoundException('Tour not found');

            const tourPackage = await packageRepo.findOne({
                where: { id: dto.packageId } as any,
            });
            if (!tourPackage) throw new NotFoundException('Tour package not found');

            const departure = await departureRepo.findOne({
                where: { id: dto.departureId } as any,
            });
            if (!departure) throw new NotFoundException('Tour departure not found');

            const option = await optionRepo.findOne({
                where: { id: dto.optionId } as any,
            });
            if (!option) throw new NotFoundException('Departure option not found');

            this.assertEntityRelations(tour as any, tourPackage as any, departure as any, option as any);
            this.assertEntitiesAreActive(tour as any, tourPackage as any, departure as any, option as any);

            const departureDate = this.getDepartureDate(departure as any);
            if (!departureDate) {
                throw new BadRequestException(
                    'Departure date is missing. Please map departure date field in service helper.',
                );
            }
            if (departureDate.getTime() <= now.getTime()) {
                throw new BadRequestException('Cannot book a departure in the past');
            }

            const reservedSlots = this.calculateReservedSlots(dto.adultCount, dto.childCount ?? 0);
            const departureCapacity = this.getDepartureCapacity(departure as any);

            if (departureCapacity <= 0) {
                throw new BadRequestException(
                    'Departure capacity is missing or invalid. Please map capacity field in service helper.',
                );
            }

            const currentReserved = await this.getCurrentReservedSlots(
                manager,
                dto.departureId,
                now,
            );

            if (currentReserved + reservedSlots > departureCapacity) {
                throw new ConflictException('Not enough available slots for this departure');
            }

            const unitPriceAdult = this.getAdultUnitPrice(tourPackage as any);
            const unitPriceChild = this.getChildUnitPrice(tourPackage as any);
            const departurePriceAdjustment = this.getDeparturePriceAdjustment(departure as any);
            const optionExtraPrice = this.getOptionExtraPrice(option as any);
            const guideExtraPrice = dto.isPrivateGuide
                ? BookingsService.PRIVATE_GUIDE_FLAT_FEE
                : 0;

            const totalAmount = this.calculateTotalAmount({
                adultCount: dto.adultCount,
                childCount: dto.childCount ?? 0,
                unitPriceAdult,
                unitPriceChild,
                departurePriceAdjustment,
                optionExtraPrice,
                guideExtraPrice,
            });

            const booking = bookingRepo.create({
                code: await this.generateBookingCode(manager),
                userId: user.userId,
                tourId: dto.tourId,
                packageId: dto.packageId,
                departureId: dto.departureId,
                optionId: dto.optionId,
                contactName: dto.contactName.trim(),
                contactEmail: dto.contactEmail.trim().toLowerCase(),
                contactPhone: dto.contactPhone?.trim(),
                adultCount: dto.adultCount,
                childCount: dto.childCount ?? 0,
                reservedSlots,
                isPrivateGuide: dto.isPrivateGuide ?? false,
                unitPriceAdult: this.toMoneyString(unitPriceAdult),
                unitPriceChild: this.toMoneyString(unitPriceChild),
                departurePriceAdjustment: this.toMoneyString(departurePriceAdjustment),
                optionExtraPrice: this.toMoneyString(optionExtraPrice),
                guideExtraPrice: this.toMoneyString(guideExtraPrice),
                totalAmount: this.toMoneyString(totalAmount),
                bookingStatus: BookingStatus.PENDING_PAYMENT,
                paymentStatus: PaymentStatus.UNPAID,
                expiresAt: this.addMinutes(now, BookingsService.PAYMENT_EXPIRE_MINUTES),
                notes: dto.notes?.trim(),
            });

            const saved = await bookingRepo.save(booking);

            const detail = await this.findBookingDetailById(manager, saved.id);

            this.realtimeGateway.emitBookingCreated({
                bookingId: saved.id,
                bookingCode: saved.code,
                userId: user.userId,
                tourId: dto.tourId,
                departureId: dto.departureId,
                message: 'A new booking has been created',
            });

            this.realtimeGateway.emitBookingUpdatedToUser(user.userId, {
                bookingId: saved.id,
                bookingCode: saved.code,
                bookingStatus: saved.bookingStatus,
                paymentStatus: saved.paymentStatus,
            });

            this.realtimeGateway.emitDepartureSlotsUpdated(dto.departureId, {
                departureId: dto.departureId,
                message: 'Departure slots changed',
            });

            return detail;
        });
    }

    async getMyBookings(userId: number, query: QueryMyBookingsDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;

        const qb = this.bookingRepository
            .createQueryBuilder('b')
            .leftJoinAndSelect('b.tour', 'tour')
            .leftJoinAndSelect('b.tourPackage', 'tourPackage')
            .leftJoinAndSelect('b.departure', 'departure')
            .leftJoinAndSelect('b.departureOption', 'departureOption')
            .where('b.userId = :userId', { userId });

        if (query.bookingStatus) {
            qb.andWhere('b.bookingStatus = :bookingStatus', {
                bookingStatus: query.bookingStatus,
            });
        }

        if (query.paymentStatus) {
            qb.andWhere('b.paymentStatus = :paymentStatus', {
                paymentStatus: query.paymentStatus,
            });
        }

        qb.orderBy('b.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const [items, total] = await qb.getManyAndCount();

        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getMyBookingById(userId: number, id: number) {
        const booking = await this.bookingRepository.findOne({
            where: { id, userId },
            relations: {
                tour: true,
                tourPackage: true,
                departure: true,
                departureOption: true,
                user: true,
            },
        });

        if (!booking) {
            throw new NotFoundException('Booking not found');
        }

        return booking;
    }

    async pay(userId: number, id: number, dto: PayBookingDto) {
        const detail = await this.dataSource.transaction(async (manager) => {
            const bookingRepo = manager.getRepository(Booking);

            const booking = await bookingRepo.findOne({
                where: { id, userId },
            });

            if (!booking) {
                throw new NotFoundException('Booking not found');
            }

            this.assertCanPay(booking);

            if (
                dto.paymentMethod === PaymentMethod.BANK_TRANSFER &&
                !dto.paymentReference?.trim()
            ) {
                throw new BadRequestException(
                    'paymentReference is required for bank transfer',
                );
            }

            booking.paymentMethod = dto.paymentMethod;
            booking.paymentReference =
                dto.paymentReference?.trim() || this.generateMockPaymentReference();
            booking.paymentStatus = PaymentStatus.PAID;
            booking.bookingStatus = BookingStatus.CONFIRMED;
            booking.paidAt = new Date();

            await bookingRepo.save(booking);

            return this.findBookingDetailById(manager, booking.id);
        });

        await this.mailService.sendPaymentSuccessEmail({
            to: detail.contactEmail || detail.user?.email,
            customerName: detail.contactName || detail.user?.name || 'Quý khách',
            bookingCode: detail.code,
            tourName: detail.tour?.name || 'Tour du lịch',
            amount: detail.totalAmount,
            paymentMethod: detail.paymentMethod,
            paidAt: detail.paidAt,
        });

        return detail;
    }

    async cancel(userId: number, id: number) {
        return this.dataSource.transaction(async (manager) => {
            const bookingRepo = manager.getRepository(Booking);
            const departureRepo = manager.getRepository(TourDeparture);

            const booking = await bookingRepo.findOne({
                where: { id, userId },
            });

            if (!booking) throw new NotFoundException('Booking not found');

            this.assertCanCancel(booking);

            // --- Update booking status
            booking.bookingStatus = BookingStatus.CANCELLED;
            booking.cancelledAt = new Date();

            if (booking.paymentStatus === PaymentStatus.UNPAID) {
                booking.paymentStatus = PaymentStatus.CANCELLED;
            }

            await bookingRepo.save(booking);

            // --- Update departure bookedSlots (không thêm availableSlots vào entity)
            const departure = await departureRepo.findOne({ where: { id: booking.departureId } });

            if (departure) {
                departure.bookedSlots = Math.max(
                    0,
                    (departure.bookedSlots || 0) - (booking.reservedSlots || 0),
                );

                // Cập nhật status nếu FULL nhưng còn chỗ
                if (departure.status === 'full' && departure.bookedSlots < departure.capacity) {
                    departure.status = TourDepartureStatus.OPEN;
                }

                await departureRepo.save(departure);
            }

            // --- Gửi realtime update
            this.realtimeGateway.emitBookingUpdatedToUser(booking.userId, {
                bookingId: booking.id,
                bookingCode: booking.code,
                bookingStatus: booking.bookingStatus,
                paymentStatus: booking.paymentStatus,
                message: 'Booking cancelled',
            });

            this.realtimeGateway.emitPaymentUpdatedToUser(booking.userId, {
                bookingId: booking.id,
                bookingCode: booking.code,
                bookingStatus: booking.bookingStatus,
                paymentStatus: booking.paymentStatus,
                paymentMethod: booking.paymentMethod,
                message: 'Payment status updated after booking cancellation',
            });

            this.realtimeGateway.emitDepartureSlotsUpdated(booking.departureId, {
                departureId: booking.departureId,
                message: 'Departure slots changed after booking cancellation',
            });

            // --- Map dữ liệu trả ra, tính availableSlots tạm
            const bookingDetail = await this.findBookingDetailById(manager, booking.id);

            const departureInfo = bookingDetail.departure
                ? {
                    ...bookingDetail.departure,
                    availableSlots: (bookingDetail.departure.capacity || 0) - (bookingDetail.departure.bookedSlots || 0),
                }
                : null;

            return {
                ...bookingDetail,
                departure: departureInfo,
            };
        });
    }

    async getAdminBookings(query: AdminQueryBookingsDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;

        const qb = this.bookingRepository
            .createQueryBuilder('b')
            .leftJoinAndSelect('b.user', 'user')
            .leftJoinAndSelect('b.tour', 'tour')
            .leftJoinAndSelect('b.tourPackage', 'tourPackage')
            .leftJoinAndSelect('b.departure', 'departure')
            .leftJoinAndSelect('b.departureOption', 'departureOption')
            .orderBy('b.createdAt', 'DESC');

        if (query.code) {
            qb.andWhere('b.code LIKE :code', {
                code: `%${query.code.trim()}%`,
            });
        }

        if (query.userId) {
            qb.andWhere('b.userId = :userId', { userId: query.userId });
        }

        if (query.tourId) {
            qb.andWhere('b.tourId = :tourId', { tourId: query.tourId });
        }

        if (query.departureId) {
            qb.andWhere('b.departureId = :departureId', {
                departureId: query.departureId,
            });
        }

        if (query.bookingStatus) {
            qb.andWhere('b.bookingStatus = :bookingStatus', {
                bookingStatus: query.bookingStatus,
            });
        }

        if (query.paymentStatus) {
            qb.andWhere('b.paymentStatus = :paymentStatus', {
                paymentStatus: query.paymentStatus,
            });
        }

        if (query.contactEmail) {
            qb.andWhere('b.contactEmail LIKE :contactEmail', {
                contactEmail: `%${query.contactEmail.trim().toLowerCase()}%`,
            });
        }

        if (query.createdFrom) {
            qb.andWhere('b.createdAt >= :createdFrom', {
                createdFrom: new Date(query.createdFrom),
            });
        }

        if (query.createdTo) {
            const end = new Date(query.createdTo);
            end.setHours(23, 59, 59, 999);

            qb.andWhere('b.createdAt <= :createdTo', {
                createdTo: end,
            });
        }

        qb.skip((page - 1) * limit).take(limit);

        const [items, total] = await qb.getManyAndCount();

        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getAdminBookingById(id: number) {
        const booking = await this.bookingRepository.findOne({
            where: { id },
            relations: {
                user: true,
                tour: true,
                tourPackage: true,
                departure: true,
                departureOption: true,
            },
        });

        if (!booking) {
            throw new NotFoundException('Booking not found');
        }

        return booking;
    }

    async confirmPaymentByAdmin(id: number, dto: AdminConfirmPaymentDto) {
        const detail = await this.dataSource.transaction(async (manager) => {
            const bookingRepo = manager.getRepository(Booking);

            const booking = await bookingRepo.findOne({
                where: { id },
            });

            if (!booking) {
                throw new NotFoundException('Booking not found');
            }

            if (
                booking.bookingStatus === BookingStatus.CANCELLED ||
                booking.bookingStatus === BookingStatus.EXPIRED
            ) {
                throw new BadRequestException(
                    'Cannot confirm payment for cancelled or expired booking',
                );
            }

            if (booking.paymentStatus === PaymentStatus.PAID) {
                throw new BadRequestException('Booking has already been paid');
            }

            booking.paymentMethod = dto.paymentMethod;
            booking.paymentReference =
                dto.paymentReference?.trim() || this.generateMockPaymentReference();
            booking.paymentStatus = PaymentStatus.PAID;
            booking.bookingStatus = BookingStatus.CONFIRMED;
            booking.paidAt = new Date();

            if (dto.note?.trim()) {
                booking.notes = booking.notes
                    ? `${booking.notes}\n[ADMIN PAYMENT NOTE] ${dto.note.trim()}`
                    : `[ADMIN PAYMENT NOTE] ${dto.note.trim()}`;
            }

            await bookingRepo.save(booking);

            this.realtimeGateway.emitPaymentUpdatedToUser(booking.userId, {
                bookingId: booking.id,
                bookingCode: booking.code,
                paymentStatus: booking.paymentStatus,
                bookingStatus: booking.bookingStatus,
                paidAt: booking.paidAt,
                paidAmount: booking.totalAmount,
                message: 'Payment confirmed by admin',
            });

            this.realtimeGateway.emitBookingUpdatedToUser(booking.userId, {
                bookingId: booking.id,
                bookingCode: booking.code,
                bookingStatus: booking.bookingStatus,
                paymentStatus: booking.paymentStatus,
            });

            return this.findBookingDetailById(manager, booking.id);
        });

        const emailTo = detail.contactEmail || detail.user?.email;

        if (emailTo) {
            void this.mailService.sendPaymentSuccessEmail({
                to: emailTo,
                customerName: detail.contactName || detail.user?.name || 'Quý khách',
                bookingCode: detail.code,
                tourName: detail.tour?.name || 'Tour du lịch',
                amount: detail.totalAmount,
                paymentMethod: detail.paymentMethod,
                paidAt: detail.paidAt,
            });
        }

        return detail;
    }

    async cancelByAdmin(id: number, dto: AdminCancelBookingDto) {
        return this.dataSource.transaction(async (manager) => {
            const bookingRepo = manager.getRepository(Booking);
            const departureRepo = manager.getRepository(TourDeparture);

            const booking = await bookingRepo.findOne({ where: { id } });
            if (!booking) throw new NotFoundException('Booking not found');

            if (
                booking.bookingStatus === BookingStatus.CANCELLED ||
                booking.bookingStatus === BookingStatus.EXPIRED
            ) {
                throw new BadRequestException(
                    'Booking is already cancelled or expired',
                );
            }

            // --- Update booking status
            booking.bookingStatus = BookingStatus.CANCELLED;
            booking.cancelledAt = new Date();
            if (booking.paymentStatus === PaymentStatus.UNPAID) {
                booking.paymentStatus = PaymentStatus.CANCELLED;
            }
            if (dto.reason?.trim()) {
                booking.notes = booking.notes
                    ? `${booking.notes}\n[ADMIN CANCEL REASON] ${dto.reason.trim()}`
                    : `[ADMIN CANCEL REASON] ${dto.reason.trim()}`;
            }
            await bookingRepo.save(booking);

            // --- Update departure bookedSlots
            const departure = await departureRepo.findOne({ where: { id: booking.departureId } });
            if (departure) {
                departure.bookedSlots = Math.max(
                    0,
                    (departure.bookedSlots || 0) - (booking.reservedSlots || 0),
                );

                // Nếu departure status FULL mà còn chỗ, chuyển về OPEN
                if (departure.status === 'full' && departure.bookedSlots < departure.capacity) {
                    departure.status = TourDepartureStatus.OPEN;
                }

                await departureRepo.save(departure);
            }

            // --- Gửi realtime
            this.realtimeGateway.emitBookingUpdatedToUser(booking.userId, {
                bookingId: booking.id,
                bookingCode: booking.code,
                bookingStatus: booking.bookingStatus,
                paymentStatus: booking.paymentStatus,
                message: 'Booking cancelled by admin',
            });

            this.realtimeGateway.emitPaymentUpdatedToUser(booking.userId, {
                bookingId: booking.id,
                bookingCode: booking.code,
                bookingStatus: booking.bookingStatus,
                paymentStatus: booking.paymentStatus,
                paymentMethod: booking.paymentMethod,
                message: 'Payment status updated by admin cancellation',
            });

            this.realtimeGateway.emitDepartureSlotsUpdated(booking.departureId, {
                departureId: booking.departureId,
                message: 'Departure slots changed after admin cancellation',
            });

            // --- Map departureInfo để frontend dùng
            const bookingDetail = await this.findBookingDetailById(manager, booking.id);

            // Map thêm availableSlots tạm để FE hiển thị
            const departureInfo = bookingDetail.departure
                ? {
                    ...bookingDetail.departure,
                    availableSlots: (bookingDetail.departure.capacity || 0) - (bookingDetail.departure.bookedSlots || 0),
                }
                : null;

            return {
                ...bookingDetail,
                departure: departureInfo,
            };
        });
    }

    async expireBookingByAdmin(id: number) {
        return this.dataSource.transaction(async (manager) => {
            const bookingRepo = manager.getRepository(Booking);

            const booking = await bookingRepo.findOne({
                where: { id },
            });

            if (!booking) {
                throw new NotFoundException('Booking not found');
            }

            if (booking.bookingStatus === BookingStatus.CONFIRMED) {
                throw new BadRequestException('Cannot expire a confirmed booking');
            }

            if (
                booking.bookingStatus === BookingStatus.CANCELLED ||
                booking.bookingStatus === BookingStatus.EXPIRED
            ) {
                throw new BadRequestException('Booking is already cancelled or expired');
            }

            booking.bookingStatus = BookingStatus.EXPIRED;
            booking.paymentStatus = PaymentStatus.EXPIRED;

            await bookingRepo.save(booking);

            this.realtimeGateway.emitBookingUpdatedToUser(booking.userId, {
                bookingId: booking.id,
                bookingCode: booking.code,
                bookingStatus: booking.bookingStatus,
                paymentStatus: booking.paymentStatus,
                message: 'Booking expired by admin',
            });

            this.realtimeGateway.emitPaymentUpdatedToUser(booking.userId, {
                bookingId: booking.id,
                bookingCode: booking.code,
                bookingStatus: booking.bookingStatus,
                paymentStatus: booking.paymentStatus,
                paymentMethod: booking.paymentMethod,
                message: 'Payment status updated after booking expiration',
            });

            this.realtimeGateway.emitDepartureSlotsUpdated(booking.departureId, {
                departureId: booking.departureId,
                message: 'Departure slots changed after booking expiration',
            });

            return this.findBookingDetailById(manager, booking.id);
        });
    }

    // @Cron(CronExpression.EVERY_MINUTE)
    // async expirePendingBookings() {
    //     const now = new Date();

    //     await this.bookingRepository
    //         .createQueryBuilder()
    //         .update(Booking)
    //         .set({
    //             bookingStatus: BookingStatus.EXPIRED,
    //             paymentStatus: PaymentStatus.EXPIRED,
    //         })
    //         .where('booking_status = :bookingStatus', {
    //             bookingStatus: BookingStatus.PENDING_PAYMENT,
    //         })
    //         .andWhere('payment_status = :paymentStatus', {
    //             paymentStatus: PaymentStatus.UNPAID,
    //         })
    //         .andWhere('expires_at < :now', { now })
    //         .execute();
    // }

    @Cron(CronExpression.EVERY_MINUTE)
    async expirePendingBookings() {
        const now = new Date();

        const bookingsToExpire = await this.bookingRepository.find({
            where: {
                bookingStatus: BookingStatus.PENDING_PAYMENT,
                paymentStatus: PaymentStatus.UNPAID,
                expiresAt: LessThan(now),
            },
            relations: {
                user: true,
                tour: true,
            },
        });

        if (bookingsToExpire.length === 0) {
            return {
                expiredCount: 0,
            };
        }

        const bookingIds = bookingsToExpire.map((booking) => booking.id);

        await this.bookingRepository.update(
            {
                id: In(bookingIds),
                bookingStatus: BookingStatus.PENDING_PAYMENT,
                paymentStatus: PaymentStatus.UNPAID,
            },
            {
                bookingStatus: BookingStatus.EXPIRED,
                paymentStatus: PaymentStatus.EXPIRED,
            },
        );

        for (const booking of bookingsToExpire) {
            const emailTo = booking.contactEmail || booking.user?.email;

            if (!emailTo) {
                continue;
            }

            void this.mailService.sendPaymentExpiredEmail({
                to: emailTo,
                customerName: booking.contactName || booking.user?.name || 'Quý khách',
                bookingCode: booking.code,
                tourName: booking.tour?.name || 'Tour du lịch',
                amount: booking.totalAmount,
                expiredAt: now,
            });
        }

        return {
            expiredCount: bookingIds.length,
        };
    }

    private async findBookingDetailById(manager: EntityManager, id: number) {
        const booking = await manager.getRepository(Booking).findOne({
            where: { id },
            relations: {
                user: true,
                tour: true,
                tourPackage: true,
                departure: true,
                departureOption: true,
            },
        });

        if (!booking) {
            throw new NotFoundException('Booking not found after save');
        }

        return booking;
    }

    private assertCanPay(booking: Booking) {
        const now = new Date();

        if (booking.bookingStatus === BookingStatus.CANCELLED) {
            throw new BadRequestException('Booking has been cancelled');
        }

        if (booking.bookingStatus === BookingStatus.EXPIRED) {
            throw new BadRequestException('Booking has expired');
        }

        if (booking.paymentStatus === PaymentStatus.PAID) {
            throw new BadRequestException('Booking has already been paid');
        }

        if (booking.expiresAt.getTime() < now.getTime()) {
            throw new BadRequestException('Booking payment window has expired');
        }

        if (booking.bookingStatus !== BookingStatus.PENDING_PAYMENT) {
            throw new BadRequestException('Only pending payment booking can be paid');
        }
    }

    private assertCanCancel(booking: Booking) {
        if (booking.bookingStatus === BookingStatus.CANCELLED) {
            throw new BadRequestException('Booking has already been cancelled');
        }

        if (booking.bookingStatus === BookingStatus.EXPIRED) {
            throw new BadRequestException('Booking has already expired');
        }
    }

    private assertEntityRelations(
        tour: any,
        tourPackage: any,
        departure: any,
        option: any,
    ) {
        const packageTourId = this.pickNumber(tourPackage, ['tourId', 'tour_id']);
        const departureTourId = this.pickNumber(departure, ['tourId', 'tour_id']);
        const departurePackageId = this.pickNumber(departure, ['packageId', 'package_id']);
        const optionDepartureId = this.pickNumber(option, ['departureId', 'departure_id']);

        if (packageTourId && packageTourId !== Number(tour.id)) {
            throw new BadRequestException('Package does not belong to the selected tour');
        }

        if (departureTourId && departureTourId !== Number(tour.id)) {
            throw new BadRequestException('Departure does not belong to the selected tour');
        }

        if (departurePackageId && departurePackageId !== Number(tourPackage.id)) {
            throw new BadRequestException('Departure does not belong to the selected package');
        }

        if (optionDepartureId && optionDepartureId !== Number(departure.id)) {
            throw new BadRequestException('Option does not belong to the selected departure');
        }
    }

    private assertEntitiesAreActive(
        tour: any,
        tourPackage: any,
        departure: any,
        option: any,
    ) {
        const checks = [
            { entity: tour, label: 'Tour' },
            { entity: tourPackage, label: 'Tour package' },
            { entity: departure, label: 'Departure' },
            { entity: option, label: 'Departure option' },
        ];

        for (const item of checks) {
            const activeValue = this.pickBoolean(item.entity, [
                'isActive',
                'active',
                'is_enabled',
                'enabled',
                'status',
            ]);

            if (activeValue === false) {
                throw new BadRequestException(`${item.label} is not active`);
            }
        }
    }

    private calculateReservedSlots(adultCount: number, childCount: number) {
        return adultCount + childCount;
    }

    private async getCurrentReservedSlots(
        manager: EntityManager,
        departureId: number,
        now: Date,
    ): Promise<number> {
        const raw = await manager
            .getRepository(Booking)
            .createQueryBuilder('b')
            .select('COALESCE(SUM(b.reservedSlots), 0)', 'total')
            .where('b.departureId = :departureId', { departureId })
            .andWhere(
                new Brackets((qb) => {
                    qb.where('b.bookingStatus = :confirmed', {
                        confirmed: BookingStatus.CONFIRMED,
                    }).orWhere(
                        new Brackets((subQb) => {
                            subQb
                                .where('b.bookingStatus = :pending', {
                                    pending: BookingStatus.PENDING_PAYMENT,
                                })
                                .andWhere('b.paymentStatus = :unpaid', {
                                    unpaid: PaymentStatus.UNPAID,
                                })
                                .andWhere('b.expiresAt > :now', { now });
                        }),
                    );
                }),
            )
            .getRawOne<{ total: string }>();

        return Number(raw?.total ?? 0);
    }

    private getAdultUnitPrice(tourPackage: any): number {
        return this.pickMoney(tourPackage, [
            'adultPrice',
            'priceAdult',
            'adult_price',
            'price_adult',
            'baseAdultPrice',
            'base_adult_price',
        ]);
    }

    private getChildUnitPrice(tourPackage: any): number {
        return this.pickMoney(tourPackage, [
            'childPrice',
            'priceChild',
            'child_price',
            'price_child',
            'baseChildPrice',
            'base_child_price',
        ]);
    }

    private getDeparturePriceAdjustment(departure: any): number {
        return this.pickMoney(departure, [
            'priceAdjustment',
            'departurePriceAdjustment',
            'price_adjustment',
            'departure_price_adjustment',
            'extraPrice',
            'extra_price',
        ]);
    }

    private getOptionExtraPrice(option: any): number {
        return this.pickMoney(option, [
            'extraPrice',
            'optionExtraPrice',
            'extra_price',
            'option_extra_price',
            'price',
        ]);
    }

    private getDepartureCapacity(departure: any): number {
        return this.pickNumber(departure, [
            'capacity',
            'maxSlots',
            'totalSlots',
            'availableSlots',
            'slotLimit',
            'max_slots',
            'total_slots',
        ]);
    }

    private getDepartureDate(departure: any): Date | null {
        const value = this.pickValue(departure, [
            'departureDate',
            'startDate',
            'departAt',
            'departDate',
            'departure_date',
            'start_date',
        ]);

        if (!value) return null;

        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    private calculateTotalAmount(input: {
        adultCount: number;
        childCount: number;
        unitPriceAdult: number;
        unitPriceChild: number;
        departurePriceAdjustment: number;
        optionExtraPrice: number;
        guideExtraPrice: number;
    }) {
        const baseAdult = input.adultCount * input.unitPriceAdult;
        const baseChild = input.childCount * input.unitPriceChild;
        const perTravelerAdjustment =
            (input.adultCount + input.childCount) *
            (input.departurePriceAdjustment + input.optionExtraPrice);

        return baseAdult + baseChild + perTravelerAdjustment + input.guideExtraPrice;
    }

    private toMoneyString(value: number): string {
        return value.toFixed(2);
    }

    private addMinutes(date: Date, minutes: number): Date {
        return new Date(date.getTime() + minutes * 60 * 1000);
    }

    private async generateBookingCode(manager: EntityManager): Promise<string> {
        for (let i = 0; i < 10; i++) {
            const now = new Date();
            const code =
                'BK' +
                now.getFullYear().toString() +
                (now.getMonth() + 1).toString().padStart(2, '0') +
                now.getDate().toString().padStart(2, '0') +
                now.getHours().toString().padStart(2, '0') +
                now.getMinutes().toString().padStart(2, '0') +
                now.getSeconds().toString().padStart(2, '0') +
                Math.floor(Math.random() * 1000)
                    .toString()
                    .padStart(3, '0');

            const exists = await manager.getRepository(Booking).exist({
                where: { code },
            });

            if (!exists) return code;
        }

        throw new ConflictException('Failed to generate unique booking code');
    }

    private generateMockPaymentReference(): string {
        return `PAY-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    }

    private pickValue(obj: any, keys: string[]) {
        for (const key of keys) {
            if (obj && obj[key] !== undefined && obj[key] !== null) {
                return obj[key];
            }
        }
        return undefined;
    }

    private pickNumber(obj: any, keys: string[]): number {
        const value = this.pickValue(obj, keys);
        if (value === undefined || value === null || value === '') {
            return 0;
        }
        return Number(value) || 0;
    }

    private pickMoney(obj: any, keys: string[]): number {
        return this.pickNumber(obj, keys);
    }

    private pickBoolean(obj: any, keys: string[]): boolean | undefined {
        for (const key of keys) {
            if (obj && obj[key] !== undefined && obj[key] !== null) {
                const value = obj[key];

                if (typeof value === 'boolean') return value;
                if (typeof value === 'number') return value === 1;
                if (typeof value === 'string') {
                    const lower = value.toLowerCase();
                    if (lower === 'active') return true;
                    if (lower === 'inactive') return false;
                    if (lower === 'true') return true;
                    if (lower === 'false') return false;
                    if (lower === '1') return true;
                    if (lower === '0') return false;
                }
            }
        }
        return undefined;
    }

    async getAdminTourOverview(query: QueryAdminTourBookingOverviewDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;

        const qb = this.bookingRepository
            .createQueryBuilder('booking')
            .leftJoin(Tour, 'tour', 'tour.id = booking.tourId')
            .leftJoin(
                PaymentTransaction,
                'payment',
                'payment.bookingId = booking.id AND payment.status = :paymentSuccessStatus',
                { paymentSuccessStatus: PaymentTransactionStatus.SUCCESS },
            )
            .select('booking.tourId', 'tourId')
            .addSelect('tour.name', 'tourName')
            .addSelect('tour.slug', 'tourSlug')
            .addSelect('tour.coverImageUrl', 'coverImageUrl')
            .addSelect('tour.destinationId', 'destinationId')
            .addSelect('COUNT(DISTINCT booking.id)', 'totalBookings')
            .addSelect('COALESCE(SUM(booking.reservedSlots), 0)', 'totalReservedSlots')
            .addSelect(
                'COALESCE(SUM(booking.adultCount + booking.childCount), 0)',
                'totalGuests',
            )
            .addSelect(
                `COUNT(DISTINCT CASE 
          WHEN booking.paymentStatus = :paidStatus THEN booking.id 
        END)`,
                'totalPaidBookings',
            )
            .addSelect(
                `COALESCE(SUM(CASE 
          WHEN payment.id IS NOT NULL THEN payment.amount 
          ELSE 0 
        END), 0)`,
                'totalPaidAmount',
            )
            .setParameter('paidStatus', PaymentStatus.PAID)
            .groupBy('booking.tourId')
            .addGroupBy('tour.name')
            .addGroupBy('tour.slug')
            .addGroupBy('tour.coverImageUrl')
            .addGroupBy('tour.destinationId')
            .orderBy('MAX(booking.createdAt)', 'DESC');

        if (query.search) {
            qb.andWhere('(tour.name LIKE :search OR tour.slug LIKE :search)', {
                search: `%${query.search}%`,
            });
        }

        if (query.destinationId) {
            qb.andWhere('tour.destinationId = :destinationId', {
                destinationId: query.destinationId,
            });
        }

        if (query.bookingStatus) {
            qb.andWhere('booking.bookingStatus = :bookingStatus', {
                bookingStatus: query.bookingStatus,
            });
        }

        if (query.paymentStatus) {
            qb.andWhere('booking.paymentStatus = :paymentStatus', {
                paymentStatus: query.paymentStatus,
            });
        }

        const groupedRows = await qb.getRawMany();

        const total = groupedRows.length;

        const pagedRows = groupedRows.slice(skip, skip + limit);

        const items = await Promise.all(
            pagedRows.map(async (row) => {
                const [departureCount, openDepartureCount] = await Promise.all([
                    this.tourDepartureRepository.count({
                        where: {
                            tourId: Number(row.tourId),
                        },
                    }),
                    this.tourDepartureRepository.count({
                        where: {
                            tourId: Number(row.tourId),
                            status: 'open' as any,
                        },
                    }),
                ]);

                return {
                    tourId: Number(row.tourId),
                    tourName: row.tourName,
                    tourSlug: row.tourSlug,
                    coverImageUrl: row.coverImageUrl,
                    destinationId: row.destinationId ? Number(row.destinationId) : null,
                    departureCount,
                    openDepartureCount,
                    totalBookings: Number(row.totalBookings ?? 0),
                    totalGuests: Number(row.totalGuests ?? 0),
                    totalReservedSlots: Number(row.totalReservedSlots ?? 0),
                    totalPaidBookings: Number(row.totalPaidBookings ?? 0),
                    totalPaidAmount: String(row.totalPaidAmount ?? '0'),
                };
            }),
        );

        return {
            items,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getAdminTourDepartures(tourId: number) {
        const tour = await this.tourRepository.findOne({
            where: { id: tourId },
        });

        if (!tour) {
            throw new NotFoundException('Tour not found');
        }

        const departures = await this.tourDepartureRepository.find({
            where: { tourId },
            order: {
                departureDate: 'ASC',
                id: 'ASC',
            },
        });

        const items = await Promise.all(
            departures.map(async (departure) => {
                const bookingQb = this.bookingRepository
                    .createQueryBuilder('booking')
                    .leftJoin(
                        PaymentTransaction,
                        'payment',
                        'payment.bookingId = booking.id AND payment.status = :paymentSuccessStatus',
                        { paymentSuccessStatus: PaymentTransactionStatus.SUCCESS },
                    )
                    .select('COUNT(DISTINCT booking.id)', 'totalBookings')
                    .addSelect('COALESCE(SUM(booking.reservedSlots), 0)', 'totalReservedSlots')
                    .addSelect(
                        'COALESCE(SUM(booking.adultCount + booking.childCount), 0)',
                        'totalGuests',
                    )
                    .addSelect(
                        `COUNT(DISTINCT CASE
              WHEN booking.paymentStatus = :paidStatus THEN booking.id
            END)`,
                        'totalPaidBookings',
                    )
                    .setParameter('paidStatus', PaymentStatus.PAID)
                    .where('booking.departureId = :departureId', {
                        departureId: departure.id,
                    })
                    .andWhere('booking.bookingStatus NOT IN (:...excludedStatuses)', {
                        excludedStatuses: [BookingStatus.CANCELLED, BookingStatus.EXPIRED],
                    });

                const raw = await bookingQb.getRawOne();

                const totalReservedSlots = Number(raw?.totalReservedSlots ?? 0);

                return {
                    departureId: Number(departure.id),
                    code: departure.code,
                    departureDate: departure.departureDate,
                    returnDate: departure.returnDate,
                    registrationDeadline: departure.registrationDeadline,
                    status: departure.status,
                    capacity: Number(departure.capacity ?? 0),
                    bookedSlots: totalReservedSlots,
                    availableSlots: Math.max(
                        0,
                        Number(departure.capacity ?? 0) - totalReservedSlots,
                    ),
                    totalBookings: Number(raw?.totalBookings ?? 0),
                    totalGuests: Number(raw?.totalGuests ?? 0),
                    totalReservedSlots,
                    totalPaidBookings: Number(raw?.totalPaidBookings ?? 0),
                    basePriceAdjustment: departure.basePriceAdjustment,
                };
            }),
        );

        return {
            tour: {
                id: Number(tour.id),
                name: tour.name,
                slug: tour.slug,
                coverImageUrl: tour.coverImageUrl,
                destinationId: Number(tour.destinationId),
            },
            items,
        };
    }

    async getAdminDepartureBookings(departureId: number) {
        const departure = await this.tourDepartureRepository.findOne({
            where: { id: departureId },
        });

        if (!departure) {
            throw new NotFoundException('Departure not found');
        }

        const rawItems = await this.bookingRepository
            .createQueryBuilder('booking')
            .leftJoin(Tour, 'tour', 'tour.id = booking.tourId')
            .leftJoin(TourPackage, 'tourPackage', 'tourPackage.id = booking.packageId')
            .leftJoin(
                DepartureOption,
                'departureOption',
                'departureOption.id = booking.optionId',
            )
            .leftJoin(
                PaymentTransaction,
                'payment',
                'payment.bookingId = booking.id AND payment.status = :paymentSuccessStatus',
                { paymentSuccessStatus: PaymentTransactionStatus.SUCCESS },
            )
            .select('booking.id', 'bookingId')
            .addSelect('booking.code', 'bookingCode')
            .addSelect('booking.userId', 'userId')
            .addSelect('booking.tourId', 'tourId')
            .addSelect('tour.name', 'tourName')
            .addSelect('booking.packageId', 'packageId')
            .addSelect('tourPackage.name', 'packageName')
            .addSelect('booking.departureId', 'departureId')
            .addSelect('booking.optionId', 'optionId')
            .addSelect('departureOption.departureCity', 'departureCity')
            .addSelect('departureOption.transportType', 'transportType')
            .addSelect('booking.contactName', 'contactName')
            .addSelect('booking.contactEmail', 'contactEmail')
            .addSelect('booking.contactPhone', 'contactPhone')
            .addSelect('booking.adultCount', 'adultCount')
            .addSelect('booking.childCount', 'childCount')
            .addSelect('booking.reservedSlots', 'reservedSlots')
            .addSelect('booking.unitPriceAdult', 'unitPriceAdult')
            .addSelect('booking.unitPriceChild', 'unitPriceChild')
            .addSelect('booking.paymentStatus', 'paymentStatus')
            .addSelect('booking.paymentMethod', 'paymentMethod')
            .addSelect('booking.bookingStatus', 'bookingStatus')
            .addSelect('booking.notes', 'notes')
            .addSelect('booking.createdAt', 'createdAt')
            .addSelect('payment.amount', 'paidAmount')
            .addSelect('payment.provider', 'paymentProvider')
            .addSelect('payment.paidAt', 'paidAt')
            .where('booking.departureId = :departureId', { departureId })
            .andWhere('booking.bookingStatus NOT IN (:...excludedStatuses)', {
                excludedStatuses: [BookingStatus.CANCELLED, BookingStatus.EXPIRED],
            })
            .orderBy('booking.createdAt', 'DESC')
            .getRawMany();

        const items = rawItems.map((row) => ({
            bookingId: Number(row.bookingId),
            bookingCode: row.bookingCode,
            userId: row.userId ? Number(row.userId) : null,
            tourId: row.tourId ? Number(row.tourId) : null,
            tourName: row.tourName,
            packageId: row.packageId ? Number(row.packageId) : null,
            packageName: row.packageName,
            departureId: row.departureId ? Number(row.departureId) : null,
            optionId: row.optionId ? Number(row.optionId) : null,
            departureCity: row.departureCity,
            transportType: row.transportType,
            contactName: row.contactName,
            contactEmail: row.contactEmail,
            contactPhone: row.contactPhone,
            adultCount: Number(row.adultCount ?? 0),
            childCount: Number(row.childCount ?? 0),
            reservedSlots: Number(row.reservedSlots ?? 0),
            unitPriceAdult: row.unitPriceAdult,
            unitPriceChild: row.unitPriceChild,
            paymentStatus: row.paymentStatus,
            paymentMethod: row.paymentMethod,
            bookingStatus: row.bookingStatus,
            notes: row.notes,
            createdAt: row.createdAt,
            paidAmount: row.paidAmount ?? null,
            paymentProvider: row.paymentProvider ?? null,
            paidAt: row.paidAt ?? null,
            optionLabel:
                row.departureCity && row.transportType
                    ? `${row.departureCity} - ${row.transportType}`
                    : null,
        }));

        return {
            departure: {
                id: Number(departure.id),
                tourId: Number(departure.tourId),
                code: departure.code,
                departureDate: departure.departureDate,
                returnDate: departure.returnDate,
                registrationDeadline: departure.registrationDeadline,
                capacity: Number(departure.capacity ?? 0),
                bookedSlots: items.reduce((sum, item) => sum + item.reservedSlots, 0),
                status: departure.status,
                basePriceAdjustment: departure.basePriceAdjustment,
            },
            items,
        };
    }

    private async sendBookingExpiredEmail(detail: any) {
        const emailTo = detail.contactEmail || detail.user?.email;

        if (!emailTo) {
            return;
        }

        await this.mailService.sendPaymentExpiredEmail({
            to: emailTo,
            customerName: detail.contactName || detail.user?.name || 'Quý khách',
            bookingCode: detail.code,
            tourName: detail.tour?.name || 'Tour du lịch',
            amount: detail.totalAmount,
            expiredAt: detail.expiredAt || new Date(),
        });
    }
}