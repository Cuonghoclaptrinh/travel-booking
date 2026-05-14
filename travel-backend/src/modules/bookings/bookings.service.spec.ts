import {
    BadRequestException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BookingsService } from './bookings.service';
import { BookingStatus, PaymentMethod, PaymentStatus } from './booking.enums';


describe('BookingsService', () => {
    let service: BookingsService;

    let bookingRepository: any;
    let userRepository: any;
    let tourRepository: any;
    let packageRepository: any;
    let departureRepository: any;
    let optionRepository: any;
    let paymentTransactionRepository: any;
    let tourDepartureRepository: any;
    let dataSource: any;

    let manager: any;
    let bookingRepoTx: any;
    let tourRepoTx: any;
    let packageRepoTx: any;
    let departureRepoTx: any;
    let optionRepoTx: any;

    const mockUser = {
        userId: 1,
        email: 'test@example.com',
        name: 'Test User',
    };

    beforeEach(() => {
        bookingRepository = {
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
        };

        userRepository = {};
        tourRepository = {};
        packageRepository = {};
        departureRepository = {};
        optionRepository = {};
        paymentTransactionRepository = {};
        tourDepartureRepository = {};

        bookingRepoTx = {
            create: jest.fn((payload) => payload),
            save: jest.fn(),
            findOne: jest.fn(),
        };

        tourRepoTx = {
            findOne: jest.fn(),
        };

        packageRepoTx = {
            findOne: jest.fn(),
        };

        departureRepoTx = {
            findOne: jest.fn(),
        };

        optionRepoTx = {
            findOne: jest.fn(),
        };

        manager = {
            getRepository: jest.fn((entity) => {
                const name = entity?.name;
                if (name === 'Booking') return bookingRepoTx;
                if (name === 'Tour') return tourRepoTx;
                if (name === 'TourPackage') return packageRepoTx;
                if (name === 'TourDeparture') return departureRepoTx;
                if (name === 'DepartureOption') return optionRepoTx;
                return {};
            }),
        };

        dataSource = {
            transaction: jest.fn((callback) => callback(manager)),
        };

        service = new BookingsService(
            bookingRepository,
            userRepository,
            tourRepository,
            packageRepository,
            departureRepository,
            optionRepository,
            paymentTransactionRepository,
            tourDepartureRepository,
            dataSource as DataSource,
        );

        jest.spyOn(service as any, 'findBookingDetailById').mockResolvedValue({
            id: 999,
            code: 'BK000001',
        });

        jest.spyOn(service as any, 'generateBookingCode').mockResolvedValue('BK000001');
        jest.spyOn(service as any, 'getCurrentReservedSlots').mockResolvedValue(2);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        const dto = {
            tourId: 10,
            packageId: 20,
            departureId: 30,
            optionId: 40,
            adultCount: 2,
            childCount: 1,
            isPrivateGuide: false,
            contactName: '  Nguyen Van A  ',
            contactEmail: '  A@MAIL.COM  ',
            contactPhone: ' 0123456789 ',
            notes: ' ghi chu ',
        };

        it('should create booking successfully', async () => {
            tourRepoTx.findOne.mockResolvedValue({
                id: 10,
                status: 'published',
            });

            packageRepoTx.findOne.mockResolvedValue({
                id: 20,
                tourId: 10,
                status: 'active',
                priceAdult: '1000000',
                priceChild: '500000',
            });

            departureRepoTx.findOne.mockResolvedValue({
                id: 30,
                tourId: 10,
                status: 'open',
                departureDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                capacity: 10,
                basePriceAdjustment: '100000',
            });

            optionRepoTx.findOne.mockResolvedValue({
                id: 40,
                departureId: 30,
                status: 'active',
                extraPrice: '50000',
            });

            bookingRepoTx.save.mockImplementation(async (payload: any) => ({
                id: 999,
                ...payload,
            }));

            const result = await service.create(mockUser, dto as any);

            expect(bookingRepoTx.create).toHaveBeenCalled();
            expect(bookingRepoTx.save).toHaveBeenCalled();

            const createdPayload = bookingRepoTx.create.mock.calls[0][0];
            expect(createdPayload.userId).toBe(1);
            expect(createdPayload.tourId).toBe(10);
            expect(createdPayload.packageId).toBe(20);
            expect(createdPayload.departureId).toBe(30);
            expect(createdPayload.optionId).toBe(40);
            expect(createdPayload.reservedSlots).toBe(3);
            expect(createdPayload.contactName).toBe('Nguyen Van A');
            expect(createdPayload.contactEmail).toBe('a@mail.com');
            expect(createdPayload.contactPhone).toBe('0123456789');
            expect(createdPayload.notes).toBe('ghi chu');
            expect(createdPayload.bookingStatus).toBe(BookingStatus.PENDING_PAYMENT);
            expect(createdPayload.paymentStatus).toBe(PaymentStatus.UNPAID);

            expect(result).toEqual({
                id: 999,
                code: 'BK000001',
            });
        });

        it('should throw NotFoundException when tour not found', async () => {
            tourRepoTx.findOne.mockResolvedValue(null);

            await expect(service.create(mockUser, dto as any)).rejects.toThrow(
                new NotFoundException('Tour not found'),
            );
        });

        it('should throw ConflictException when available slots are not enough', async () => {
            tourRepoTx.findOne.mockResolvedValue({
                id: 10,
                status: 'published',
            });

            packageRepoTx.findOne.mockResolvedValue({
                id: 20,
                tourId: 10,
                status: 'active',
                priceAdult: '1000000',
                priceChild: '500000',
            });

            departureRepoTx.findOne.mockResolvedValue({
                id: 30,
                tourId: 10,
                status: 'open',
                departureDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                capacity: 4,
                basePriceAdjustment: '0',
            });

            optionRepoTx.findOne.mockResolvedValue({
                id: 40,
                departureId: 30,
                status: 'active',
                extraPrice: '0',
            });

            (service as any).getCurrentReservedSlots.mockResolvedValue(2);

            await expect(service.create(mockUser, dto as any)).rejects.toThrow(
                new ConflictException('Not enough available slots for this departure'),
            );
        });

        [{
            "resource": "/D:/PersonalProject/travel-backend/src/modules/bookings/bookings.service.spec.ts",
            "owner": "typescript",
            "code": "2304",
            "severity": 8,
            "message": "Cannot find name 'dto'.",
            "source": "ts",
            "startLineNumber": 297,
            "startColumn": 47,
            "endLineNumber": 297,
            "endColumn": 50,
            "modelVersionId": 10,
            "origin": "extHost1"
        }, {
            "resource": "/D:/PersonalProject/travel-backend/src/modules/bookings/bookings.service.spec.ts",
            "owner": "typescript",
            "code": "2304",
            "severity": 8,
            "message": "Cannot find name 'dto'.",
            "source": "ts",
            "startLineNumber": 318,
            "startColumn": 47,
            "endLineNumber": 318,
            "endColumn": 50,
            "modelVersionId": 10,
            "origin": "extHost1"
        }, {
            "resource": "/D:/PersonalProject/travel-backend/src/modules/bookings/bookings.service.spec.ts",
            "owner": "typescript",
            "code": "2304",
            "severity": 8,
            "message": "Cannot find name 'dto'.",
            "source": "ts",
            "startLineNumber": 348,
            "startColumn": 47,
            "endLineNumber": 348,
            "endColumn": 50,
            "modelVersionId": 10,
            "origin": "extHost1"
        }, {
            "resource": "/D:/PersonalProject/travel-backend/src/modules/bookings/bookings.service.spec.ts",
            "owner": "typescript",
            "code": "2304",
            "severity": 8,
            "message": "Cannot find name 'dto'.",
            "source": "ts",
            "startLineNumber": 383,
            "startColumn": 47,
            "endLineNumber": 383,
            "endColumn": 50,
            "modelVersionId": 10,
            "origin": "extHost1"
        }]
        it('should throw NotFoundException when package not found', async () => {
            tourRepoTx.findOne.mockResolvedValue({
                id: 10,
                status: 'published',
            });

            packageRepoTx.findOne.mockResolvedValue(null);

            await expect(service.create(mockUser, dto as any)).rejects.toThrow(
                new NotFoundException('Tour package not found'),
            );
        });

        it('should throw NotFoundException when departure not found', async () => {
            tourRepoTx.findOne.mockResolvedValue({
                id: 10,
                status: 'published',
            });

            packageRepoTx.findOne.mockResolvedValue({
                id: 20,
                tourId: 10,
                status: 'active',
                priceAdult: '1000000',
                priceChild: '500000',
            });

            departureRepoTx.findOne.mockResolvedValue(null);

            await expect(service.create(mockUser, dto as any)).rejects.toThrow(
                new NotFoundException('Tour departure not found'),
            );
        });

        it('should throw NotFoundException when option not found', async () => {
            tourRepoTx.findOne.mockResolvedValue({
                id: 10,
                status: 'published',
            });

            packageRepoTx.findOne.mockResolvedValue({
                id: 20,
                tourId: 10,
                status: 'active',
                priceAdult: '1000000',
                priceChild: '500000',
            });

            departureRepoTx.findOne.mockResolvedValue({
                id: 30,
                tourId: 10,
                status: 'open',
                departureDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                capacity: 10,
                basePriceAdjustment: '0',
            });

            optionRepoTx.findOne.mockResolvedValue(null);

            await expect(service.create(mockUser, dto as any)).rejects.toThrow(
                new NotFoundException('Departure option not found'),
            );
        });

        it('should throw BadRequestException when departure date has passed', async () => {
            tourRepoTx.findOne.mockResolvedValue({
                id: 10,
                status: 'published',
            });

            packageRepoTx.findOne.mockResolvedValue({
                id: 20,
                tourId: 10,
                status: 'active',
                priceAdult: '1000000',
                priceChild: '500000',
            });

            departureRepoTx.findOne.mockResolvedValue({
                id: 30,
                tourId: 10,
                status: 'open',
                departureDate: new Date(Date.now() - 60 * 1000),
                capacity: 10,
                basePriceAdjustment: '0',
            });

            optionRepoTx.findOne.mockResolvedValue({
                id: 40,
                departureId: 30,
                status: 'active',
                extraPrice: '0',
            });

            await expect(service.create(mockUser, dto as any)).rejects.toThrow(
                new BadRequestException('Cannot book a departure in the past'),
            );
        });
    });

    describe('pay', () => {
        it('should throw BadRequestException when bank transfer has no payment reference', async () => {
            bookingRepoTx.findOne.mockResolvedValue({
                id: 1,
                userId: 1,
                bookingStatus: BookingStatus.PENDING_PAYMENT,
                paymentStatus: PaymentStatus.UNPAID,
                expiresAt: new Date(Date.now() + 60_000),
            });

            await expect(
                service.pay(1, 1, {
                    paymentMethod: PaymentMethod.BANK_TRANSFER,
                } as any),
            ).rejects.toThrow(
                new BadRequestException('paymentReference is required for bank transfer'),
            );
        });
        it('should pay booking successfully with cash', async () => {
            bookingRepoTx.findOne.mockResolvedValue({
                id: 1,
                userId: 1,
                bookingStatus: BookingStatus.PENDING_PAYMENT,
                paymentStatus: PaymentStatus.UNPAID,
                expiresAt: new Date(Date.now() + 60_000),
            });

            bookingRepoTx.save.mockImplementation(async (payload: any) => payload);

            jest.spyOn(service as any, 'findBookingDetailById').mockResolvedValue({
                id: 1,
                bookingStatus: BookingStatus.CONFIRMED,
                paymentStatus: PaymentStatus.PAID,
                paymentMethod: PaymentMethod.CASH,
            });

            const result = await service.pay(1, 1, {
                paymentMethod: PaymentMethod.CASH,
            } as any);

            expect(bookingRepoTx.save).toHaveBeenCalled();

            const savedPayload = bookingRepoTx.save.mock.calls[0][0];
            expect(savedPayload.paymentMethod).toBe(PaymentMethod.CASH);
            expect(savedPayload.paymentStatus).toBe(PaymentStatus.PAID);
            expect(savedPayload.bookingStatus).toBe(BookingStatus.CONFIRMED);
            expect(savedPayload.paidAt).toBeInstanceOf(Date);

            expect(result).toEqual({
                id: 1,
                bookingStatus: BookingStatus.CONFIRMED,
                paymentStatus: PaymentStatus.PAID,
                paymentMethod: PaymentMethod.CASH,
            });
        });

        it('should pay booking successfully with bank transfer and payment reference', async () => {
            bookingRepoTx.findOne.mockResolvedValue({
                id: 1,
                userId: 1,
                bookingStatus: BookingStatus.PENDING_PAYMENT,
                paymentStatus: PaymentStatus.UNPAID,
                expiresAt: new Date(Date.now() + 60_000),
            });

            bookingRepoTx.save.mockImplementation(async (payload: any) => payload);

            jest.spyOn(service as any, 'findBookingDetailById').mockResolvedValue({
                id: 1,
                bookingStatus: BookingStatus.CONFIRMED,
                paymentStatus: PaymentStatus.PAID,
                paymentMethod: PaymentMethod.BANK_TRANSFER,
                paymentReference: 'VCB123456',
            });

            const result = await service.pay(1, 1, {
                paymentMethod: PaymentMethod.BANK_TRANSFER,
                paymentReference: 'VCB123456',
            } as any);

            expect(bookingRepoTx.save).toHaveBeenCalled();

            const savedPayload = bookingRepoTx.save.mock.calls[0][0];
            expect(savedPayload.paymentMethod).toBe(PaymentMethod.BANK_TRANSFER);
            expect(savedPayload.paymentReference).toBe('VCB123456');
            expect(savedPayload.paymentStatus).toBe(PaymentStatus.PAID);
            expect(savedPayload.bookingStatus).toBe(BookingStatus.CONFIRMED);
            expect(savedPayload.paidAt).toBeInstanceOf(Date);

            expect(result).toEqual({
                id: 1,
                bookingStatus: BookingStatus.CONFIRMED,
                paymentStatus: PaymentStatus.PAID,
                paymentMethod: PaymentMethod.BANK_TRANSFER,
                paymentReference: 'VCB123456',
            });
        });
    });

    describe('cancel', () => {
        it('should cancel booking and set paymentStatus to CANCELLED when unpaid', async () => {
            bookingRepoTx.findOne.mockResolvedValue({
                id: 1,
                userId: 1,
                bookingStatus: BookingStatus.PENDING_PAYMENT,
                paymentStatus: PaymentStatus.UNPAID,
            });

            bookingRepoTx.save.mockImplementation(async (payload: any) => payload);

            jest.spyOn(service as any, 'findBookingDetailById').mockResolvedValue({
                id: 1,
                bookingStatus: BookingStatus.CANCELLED,
                paymentStatus: PaymentStatus.CANCELLED,
            });

            const result = await service.cancel(1, 1);

            expect(bookingRepoTx.save).toHaveBeenCalled();
            const savedPayload = bookingRepoTx.save.mock.calls[0][0];

            expect(savedPayload.bookingStatus).toBe(BookingStatus.CANCELLED);
            expect(savedPayload.paymentStatus).toBe(PaymentStatus.CANCELLED);
            expect(savedPayload.cancelledAt).toBeInstanceOf(Date);

            expect(result).toEqual({
                id: 1,
                bookingStatus: BookingStatus.CANCELLED,
                paymentStatus: PaymentStatus.CANCELLED,
            });
        });
        it('should cancel paid booking without changing paymentStatus to CANCELLED', async () => {
            bookingRepoTx.findOne.mockResolvedValue({
                id: 1,
                userId: 1,
                bookingStatus: BookingStatus.CONFIRMED,
                paymentStatus: PaymentStatus.PAID,
            });

            bookingRepoTx.save.mockImplementation(async (payload: any) => payload);

            jest.spyOn(service as any, 'findBookingDetailById').mockResolvedValue({
                id: 1,
                bookingStatus: BookingStatus.CANCELLED,
                paymentStatus: PaymentStatus.PAID,
            });

            const result = await service.cancel(1, 1);

            expect(bookingRepoTx.save).toHaveBeenCalled();

            const savedPayload = bookingRepoTx.save.mock.calls[0][0];
            expect(savedPayload.bookingStatus).toBe(BookingStatus.CANCELLED);
            expect(savedPayload.paymentStatus).toBe(PaymentStatus.PAID);
            expect(savedPayload.cancelledAt).toBeInstanceOf(Date);

            expect(result).toEqual({
                id: 1,
                bookingStatus: BookingStatus.CANCELLED,
                paymentStatus: PaymentStatus.PAID,
            });
        });
    });

    describe('getMyBookingById', () => {
        it('should return booking detail when booking exists', async () => {
            const bookingDetail = {
                id: 1,
                userId: 1,
                code: 'BK000001',
                bookingStatus: BookingStatus.PENDING_PAYMENT,
                paymentStatus: PaymentStatus.UNPAID,
            };

            bookingRepository.findOne = jest.fn().mockResolvedValue(bookingDetail);

            const result = await service.getMyBookingById(1, 1);

            expect(bookingRepository.findOne).toHaveBeenCalled();
            expect(result).toEqual(bookingDetail);
        });

        it('should throw NotFoundException when booking does not exist', async () => {
            bookingRepository.findOne = jest.fn().mockResolvedValue(null);

            await expect(service.getMyBookingById(1, 999)).rejects.toThrow(
                new NotFoundException('Booking not found'),
            );

            expect(bookingRepository.findOne).toHaveBeenCalled();
        });
    });

    describe('getMyBookings', () => {
        it('should return paginated bookings for current user', async () => {
            const mockItems = [
                {
                    id: 1,
                    userId: 1,
                    code: 'BK000001',
                    bookingStatus: BookingStatus.PENDING_PAYMENT,
                    paymentStatus: PaymentStatus.UNPAID,
                },
                {
                    id: 2,
                    userId: 1,
                    code: 'BK000002',
                    bookingStatus: BookingStatus.CONFIRMED,
                    paymentStatus: PaymentStatus.PAID,
                },
            ];

            const mockQueryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([mockItems, 2]),
            };

            bookingRepository.createQueryBuilder = jest
                .fn()
                .mockReturnValue(mockQueryBuilder);

            const result = await service.getMyBookings(1, {
                page: 1,
                limit: 10,
            } as any);

            expect(bookingRepository.createQueryBuilder).toHaveBeenCalled();
            expect(mockQueryBuilder.where).toHaveBeenCalled();
            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);

            expect(result).toEqual({
                items: mockItems,
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 2,
                    totalPages: 1,
                },
            });
        });

        it('should apply bookingStatus filter when provided', async () => {
            const mockQueryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
            };

            bookingRepository.createQueryBuilder = jest
                .fn()
                .mockReturnValue(mockQueryBuilder);

            await service.getMyBookings(1, {
                page: 1,
                limit: 10,
                bookingStatus: BookingStatus.PENDING_PAYMENT,
            } as any);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
        });

        it('should apply paymentStatus filter when provided', async () => {
            const mockQueryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
            };

            bookingRepository.createQueryBuilder = jest
                .fn()
                .mockReturnValue(mockQueryBuilder);

            await service.getMyBookings(1, {
                page: 1,
                limit: 10,
                paymentStatus: PaymentStatus.PAID,
            } as any);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
        });
    });

    describe('confirmPaymentByAdmin', () => {
        it('should confirm payment by admin successfully', async () => {
            bookingRepoTx.findOne.mockResolvedValue({
                id: 1,
                bookingStatus: BookingStatus.PENDING_PAYMENT,
                paymentStatus: PaymentStatus.UNPAID,
            });

            bookingRepoTx.save.mockImplementation(async (payload: any) => payload);

            jest.spyOn(service as any, 'findBookingDetailById').mockResolvedValue({
                id: 1,
                bookingStatus: BookingStatus.CONFIRMED,
                paymentStatus: PaymentStatus.PAID,
                paymentMethod: PaymentMethod.BANK_TRANSFER,
                paymentReference: 'ADMINREF001',
            });

            const result = await service.confirmPaymentByAdmin(1, {
                paymentMethod: PaymentMethod.BANK_TRANSFER,
                paymentReference: 'ADMINREF001',
            } as any);

            expect(bookingRepoTx.findOne).toHaveBeenCalled();
            expect(bookingRepoTx.save).toHaveBeenCalled();

            const savedPayload = bookingRepoTx.save.mock.calls[0][0];
            expect(savedPayload.paymentMethod).toBe(PaymentMethod.BANK_TRANSFER);
            expect(savedPayload.paymentReference).toBe('ADMINREF001');
            expect(savedPayload.paymentStatus).toBe(PaymentStatus.PAID);
            expect(savedPayload.bookingStatus).toBe(BookingStatus.CONFIRMED);
            expect(savedPayload.paidAt).toBeInstanceOf(Date);

            expect(result).toEqual({
                id: 1,
                bookingStatus: BookingStatus.CONFIRMED,
                paymentStatus: PaymentStatus.PAID,
                paymentMethod: PaymentMethod.BANK_TRANSFER,
                paymentReference: 'ADMINREF001',
            });
        });

        it('should throw NotFoundException when booking does not exist', async () => {
            bookingRepoTx.findOne.mockResolvedValue(null);

            await expect(
                service.confirmPaymentByAdmin(999, {
                    paymentMethod: PaymentMethod.CASH,
                } as any),
            ).rejects.toThrow(new NotFoundException('Booking not found'));

            expect(bookingRepoTx.findOne).toHaveBeenCalled();
        });

        it('should confirm bank transfer by admin without payment reference', async () => {
            bookingRepoTx.findOne.mockResolvedValue({
                id: 1,
                bookingStatus: BookingStatus.PENDING_PAYMENT,
                paymentStatus: PaymentStatus.UNPAID,
            });

            bookingRepoTx.save.mockImplementation(async (payload: any) => payload);

            jest.spyOn(service as any, 'findBookingDetailById').mockResolvedValue({
                id: 1,
                bookingStatus: BookingStatus.CONFIRMED,
                paymentStatus: PaymentStatus.PAID,
                paymentMethod: PaymentMethod.BANK_TRANSFER,
            });

            const result = await service.confirmPaymentByAdmin(1, {
                paymentMethod: PaymentMethod.BANK_TRANSFER,
            } as any);

            expect(bookingRepoTx.findOne).toHaveBeenCalled();
            expect(bookingRepoTx.save).toHaveBeenCalled();

            const savedPayload = bookingRepoTx.save.mock.calls[0][0];
            expect(savedPayload.paymentMethod).toBe(PaymentMethod.BANK_TRANSFER);
            expect(savedPayload.paymentStatus).toBe(PaymentStatus.PAID);
            expect(savedPayload.bookingStatus).toBe(BookingStatus.CONFIRMED);
            expect(savedPayload.paidAt).toBeInstanceOf(Date);

            expect(result).toEqual({
                id: 1,
                bookingStatus: BookingStatus.CONFIRMED,
                paymentStatus: PaymentStatus.PAID,
                paymentMethod: PaymentMethod.BANK_TRANSFER,
            });
        });
    });

    describe('cancelByAdmin', () => {
        it('should cancel unpaid booking by admin and set paymentStatus to CANCELLED', async () => {
            bookingRepoTx.findOne.mockResolvedValue({
                id: 1,
                bookingStatus: BookingStatus.PENDING_PAYMENT,
                paymentStatus: PaymentStatus.UNPAID,
            });

            bookingRepoTx.save.mockImplementation(async (payload: any) => payload);

            jest.spyOn(service as any, 'findBookingDetailById').mockResolvedValue({
                id: 1,
                bookingStatus: BookingStatus.CANCELLED,
                paymentStatus: PaymentStatus.CANCELLED,
            });

            const result = await service.cancelByAdmin(1, {
                reason: 'Customer requested cancellation',
            } as any);

            expect(bookingRepoTx.findOne).toHaveBeenCalled();
            expect(bookingRepoTx.save).toHaveBeenCalled();

            const savedPayload = bookingRepoTx.save.mock.calls[0][0];
            expect(savedPayload.bookingStatus).toBe(BookingStatus.CANCELLED);
            expect(savedPayload.paymentStatus).toBe(PaymentStatus.CANCELLED);
            expect(savedPayload.cancelledAt).toBeInstanceOf(Date);

            expect(result).toEqual({
                id: 1,
                bookingStatus: BookingStatus.CANCELLED,
                paymentStatus: PaymentStatus.CANCELLED,
            });
        });

        it('should cancel paid booking by admin without changing paymentStatus', async () => {
            bookingRepoTx.findOne.mockResolvedValue({
                id: 1,
                bookingStatus: BookingStatus.CONFIRMED,
                paymentStatus: PaymentStatus.PAID,
            });

            bookingRepoTx.save.mockImplementation(async (payload: any) => payload);

            jest.spyOn(service as any, 'findBookingDetailById').mockResolvedValue({
                id: 1,
                bookingStatus: BookingStatus.CANCELLED,
                paymentStatus: PaymentStatus.PAID,
            });

            const result = await service.cancelByAdmin(1, {
                reason: 'Tour operation issue',
            } as any);

            expect(bookingRepoTx.findOne).toHaveBeenCalled();
            expect(bookingRepoTx.save).toHaveBeenCalled();

            const savedPayload = bookingRepoTx.save.mock.calls[0][0];
            expect(savedPayload.bookingStatus).toBe(BookingStatus.CANCELLED);
            expect(savedPayload.paymentStatus).toBe(PaymentStatus.PAID);
            expect(savedPayload.cancelledAt).toBeInstanceOf(Date);

            expect(result).toEqual({
                id: 1,
                bookingStatus: BookingStatus.CANCELLED,
                paymentStatus: PaymentStatus.PAID,
            });
        });

        it('should throw NotFoundException when booking does not exist', async () => {
            bookingRepoTx.findOne.mockResolvedValue(null);

            await expect(
                service.cancelByAdmin(999, {
                    reason: 'Not found case',
                } as any),
            ).rejects.toThrow(new NotFoundException('Booking not found'));

            expect(bookingRepoTx.findOne).toHaveBeenCalled();
        });
    });

    describe('expireBookingByAdmin', () => {
        it('should expire unpaid booking by admin successfully', async () => {
            bookingRepoTx.findOne.mockResolvedValue({
                id: 1,
                bookingStatus: BookingStatus.PENDING_PAYMENT,
                paymentStatus: PaymentStatus.UNPAID,
            });

            bookingRepoTx.save.mockImplementation(async (payload: any) => payload);

            jest.spyOn(service as any, 'findBookingDetailById').mockResolvedValue({
                id: 1,
                bookingStatus: BookingStatus.EXPIRED,
                paymentStatus: PaymentStatus.EXPIRED,
            });

            const result = await service.expireBookingByAdmin(1);

            expect(bookingRepoTx.findOne).toHaveBeenCalled();
            expect(bookingRepoTx.save).toHaveBeenCalled();

            const savedPayload = bookingRepoTx.save.mock.calls[0][0];
            expect(savedPayload.bookingStatus).toBe(BookingStatus.EXPIRED);
            expect(savedPayload.paymentStatus).toBe(PaymentStatus.EXPIRED);

            expect(result).toEqual({
                id: 1,
                bookingStatus: BookingStatus.EXPIRED,
                paymentStatus: PaymentStatus.EXPIRED,
            });
        });

        it('should throw NotFoundException when booking does not exist', async () => {
            bookingRepoTx.findOne.mockResolvedValue(null);

            await expect(service.expireBookingByAdmin(999)).rejects.toThrow(
                new NotFoundException('Booking not found'),
            );

            expect(bookingRepoTx.findOne).toHaveBeenCalled();
        });

        it('should throw BadRequestException when booking is already confirmed', async () => {
            bookingRepoTx.findOne.mockResolvedValue({
                id: 1,
                bookingStatus: BookingStatus.CONFIRMED,
                paymentStatus: PaymentStatus.PAID,
            });

            await expect(service.expireBookingByAdmin(1)).rejects.toThrow(
                new BadRequestException('Cannot expire a confirmed booking'),
            );

            expect(bookingRepoTx.findOne).toHaveBeenCalled();
        });
    });

    describe('getAdminBookingById', () => {
        it('should return booking detail when booking exists', async () => {
            const bookingDetail = {
                id: 1,
                code: 'BK000001',
                bookingStatus: BookingStatus.PENDING_PAYMENT,
                paymentStatus: PaymentStatus.UNPAID,
            };

            bookingRepository.findOne = jest.fn().mockResolvedValue(bookingDetail);

            const result = await service.getAdminBookingById(1);

            expect(bookingRepository.findOne).toHaveBeenCalled();
            expect(result).toEqual(bookingDetail);
        });

        it('should throw NotFoundException when booking does not exist', async () => {
            bookingRepository.findOne = jest.fn().mockResolvedValue(null);

            await expect(service.getAdminBookingById(999)).rejects.toThrow(
                new NotFoundException('Booking not found'),
            );

            expect(bookingRepository.findOne).toHaveBeenCalled();
        });
    });

    describe('getAdminBookings', () => {
        it('should return paginated admin bookings', async () => {
            const mockItems = [
                {
                    id: 1,
                    code: 'BK000001',
                    bookingStatus: BookingStatus.PENDING_PAYMENT,
                    paymentStatus: PaymentStatus.UNPAID,
                },
                {
                    id: 2,
                    code: 'BK000002',
                    bookingStatus: BookingStatus.CONFIRMED,
                    paymentStatus: PaymentStatus.PAID,
                },
            ];

            const mockQueryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([mockItems, 2]),
            };

            bookingRepository.createQueryBuilder = jest
                .fn()
                .mockReturnValue(mockQueryBuilder);

            const result = await service.getAdminBookings({
                page: 1,
                limit: 10,
            } as any);

            expect(bookingRepository.createQueryBuilder).toHaveBeenCalled();
            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);

            expect(result).toEqual({
                items: mockItems,
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 2,
                    totalPages: 1,
                },
            });
        });

        it('should apply code filter when provided', async () => {
            const mockQueryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
            };

            bookingRepository.createQueryBuilder = jest
                .fn()
                .mockReturnValue(mockQueryBuilder);

            await service.getAdminBookings({
                page: 1,
                limit: 10,
                code: 'BK000001',
            } as any);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
        });

        it('should apply bookingStatus and paymentStatus filters when provided', async () => {
            const mockQueryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
            };

            bookingRepository.createQueryBuilder = jest
                .fn()
                .mockReturnValue(mockQueryBuilder);

            await service.getAdminBookings({
                page: 1,
                limit: 10,
                bookingStatus: BookingStatus.PENDING_PAYMENT,
                paymentStatus: PaymentStatus.UNPAID,
            } as any);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
        });
    });

    describe('getAdminTourOverview', () => {
        it('should return paginated admin tour overview', async () => {
            const rawRows = [
                {
                    tourId: '10',
                    tourName: 'Da Nang 3N2D',
                    tourSlug: 'da-nang-3n2d',
                    coverImageUrl: 'cover.jpg',
                    destinationId: '5',
                    totalBookings: '5',
                    totalGuests: '8',
                    totalReservedSlots: '8',
                    totalPaidBookings: '3',
                    totalPaidAmount: '15000000',
                },
            ];

            const mockQueryBuilder = {
                leftJoin: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                setParameter: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                groupBy: jest.fn().mockReturnThis(),
                addGroupBy: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getRawMany: jest.fn().mockResolvedValue(rawRows),
            };

            bookingRepository.createQueryBuilder = jest
                .fn()
                .mockReturnValue(mockQueryBuilder);

            tourDepartureRepository.count = jest
                .fn()
                .mockResolvedValueOnce(2) // departureCount
                .mockResolvedValueOnce(1); // openDepartureCount

            const result = await service.getAdminTourOverview({
                page: 1,
                limit: 10,
            } as any);

            expect(bookingRepository.createQueryBuilder).toHaveBeenCalled();
            expect(mockQueryBuilder.setParameter).toHaveBeenCalledWith(
                'paidStatus',
                PaymentStatus.PAID,
            );

            expect(result).toEqual({
                items: [
                    {
                        tourId: 10,
                        tourName: 'Da Nang 3N2D',
                        tourSlug: 'da-nang-3n2d',
                        coverImageUrl: 'cover.jpg',
                        destinationId: 5,
                        departureCount: 2,
                        openDepartureCount: 1,
                        totalBookings: 5,
                        totalGuests: 8,
                        totalReservedSlots: 8,
                        totalPaidBookings: 3,
                        totalPaidAmount: '15000000',
                    },
                ],
                meta: {
                    page: 1,
                    limit: 10,
                    total: 1,
                    totalPages: 1,
                },
            });
        });

        it('should apply destinationId filter when provided', async () => {
            const mockQueryBuilder = {
                leftJoin: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                setParameter: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                groupBy: jest.fn().mockReturnThis(),
                addGroupBy: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getRawMany: jest.fn().mockResolvedValue([]),
            };

            bookingRepository.createQueryBuilder = jest
                .fn()
                .mockReturnValue(mockQueryBuilder);

            await service.getAdminTourOverview({
                page: 1,
                limit: 10,
                destinationId: 1,
            } as any);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
        });
    });

    describe('getAdminTourDepartures', () => {
        it('should return departures of a tour', async () => {
            tourRepository.findOne = jest.fn().mockResolvedValue({
                id: 10,
                name: 'Da Nang 3N2D',
                slug: 'da-nang-3n2d',
                coverImageUrl: 'cover.jpg',
                destinationId: 5,
            });

            tourDepartureRepository.find = jest.fn().mockResolvedValue([
                {
                    id: 1,
                    tourId: 10,
                    code: 'DEP001',
                    departureDate: new Date('2026-05-01'),
                    returnDate: new Date('2026-05-03'),
                    registrationDeadline: new Date('2026-04-28'),
                    status: 'open',
                    capacity: 20,
                    basePriceAdjustment: '100000.00',
                },
            ]);

            const bookingQb = {
                leftJoin: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                setParameter: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                getRawOne: jest.fn().mockResolvedValue({
                    totalBookings: '5',
                    totalGuests: '8',
                    totalReservedSlots: '8',
                    totalPaidBookings: '3',
                }),
            };

            bookingRepository.createQueryBuilder = jest.fn().mockReturnValue(bookingQb);

            const result = await service.getAdminTourDepartures(10);

            expect(tourRepository.findOne).toHaveBeenCalled();
            expect(tourDepartureRepository.find).toHaveBeenCalled();

            expect(result).toEqual({
                tour: {
                    id: 10,
                    name: 'Da Nang 3N2D',
                    slug: 'da-nang-3n2d',
                    coverImageUrl: 'cover.jpg',
                    destinationId: 5,
                },
                items: [
                    {
                        departureId: 1,
                        code: 'DEP001',
                        departureDate: new Date('2026-05-01'),
                        returnDate: new Date('2026-05-03'),
                        registrationDeadline: new Date('2026-04-28'),
                        status: 'open',
                        capacity: 20,
                        bookedSlots: 8,
                        availableSlots: 12,
                        totalBookings: 5,
                        totalGuests: 8,
                        totalReservedSlots: 8,
                        totalPaidBookings: 3,
                        basePriceAdjustment: '100000.00',
                    },
                ],
            });
        });

        it('should throw NotFoundException when tour does not exist', async () => {
            tourRepository.findOne = jest.fn().mockResolvedValue(null);

            await expect(service.getAdminTourDepartures(999)).rejects.toThrow(
                new NotFoundException('Tour not found'),
            );

            expect(tourRepository.findOne).toHaveBeenCalled();
        });
    });

    describe('getAdminDepartureBookings', () => {
        it('should return bookings of a departure', async () => {
            tourDepartureRepository.findOne = jest.fn().mockResolvedValue({
                id: 30,
                code: 'DEP001',
            });

            const bookingQb = {
                leftJoin: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getRawMany: jest.fn().mockResolvedValue([
                    {
                        bookingId: '1',
                        bookingCode: 'BK000001',
                        userId: '1',
                        tourId: '10',
                        tourName: 'Da Nang 3N2D',
                        packageId: '20',
                        packageName: 'Standard',
                        departureId: '30',
                        optionId: '40',
                        departureCity: 'Hanoi',
                        transportType: 'flight',
                        contactName: 'Nguyen Van A',
                        contactEmail: 'a@mail.com',
                        contactPhone: '0123456789',
                        adultCount: '2',
                        childCount: '1',
                        reservedSlots: '3',
                        unitPriceAdult: '1000000.00',
                        unitPriceChild: '500000.00',
                        paymentStatus: PaymentStatus.PAID,
                        paymentMethod: PaymentMethod.BANK_TRANSFER,
                        bookingStatus: BookingStatus.CONFIRMED,
                        notes: 'test',
                        createdAt: new Date('2026-04-23T10:00:00.000Z'),
                        paidAmount: '2500000.00',
                        paymentProvider: 'PAYOS',
                        paidAt: new Date('2026-04-23T11:00:00.000Z'),
                    },
                ]),
            };

            bookingRepository.createQueryBuilder = jest.fn().mockReturnValue(bookingQb);

            const result = await service.getAdminDepartureBookings(30);

            expect(tourDepartureRepository.findOne).toHaveBeenCalled();
            expect(bookingRepository.createQueryBuilder).toHaveBeenCalled();

            expect(result.items).toHaveLength(1);
            expect(result.items[0]).toMatchObject({
                bookingId: 1,
                bookingCode: 'BK000001',
                departureId: 30,
                paymentStatus: PaymentStatus.PAID,
                bookingStatus: BookingStatus.CONFIRMED,
            });
        });

        it('should throw NotFoundException when departure does not exist', async () => {
            tourDepartureRepository.findOne = jest.fn().mockResolvedValue(null);

            await expect(service.getAdminDepartureBookings(999)).rejects.toThrow(
                new NotFoundException('Departure not found'),
            );

            expect(tourDepartureRepository.findOne).toHaveBeenCalled();
        });
    });
});