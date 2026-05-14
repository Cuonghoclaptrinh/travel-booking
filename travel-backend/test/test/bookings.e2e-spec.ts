import { CanActivate, ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { BookingsController } from 'src/modules/bookings/bookings.controller';
import { BookingsService } from 'src/modules/bookings/bookings.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/modules/access-control/guards/permissions.guard';
import { BookingStatus, PaymentMethod, PaymentStatus } from 'src/modules/bookings/booking.enums';

class MockJwtAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest();
        req.user = {
            userId: 1,
            email: 'test@example.com',
            name: 'Test User',
            permissions: [
                'booking.create',
                'booking.my.view',
                'booking.my.pay',
                'booking.my.cancel',
            ],
        };
        return true;
    }
}

class MockPermissionsGuard implements CanActivate {
    canActivate(): boolean {
        return true;
    }
}

describe('BookingsController (e2e)', () => {
    let app: INestApplication;

    const bookingsServiceMock = {
        create: jest.fn(),
        getMyBookings: jest.fn(),
        getMyBookingById: jest.fn(),
        pay: jest.fn(),
        cancel: jest.fn(),
    };

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [BookingsController],
            providers: [
                {
                    provide: BookingsService,
                    useValue: bookingsServiceMock,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useClass(MockJwtAuthGuard)
            .overrideGuard(PermissionsGuard)
            .useClass(MockPermissionsGuard)
            .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                transform: true,
                forbidNonWhitelisted: true,
            }),
        );
        await app.init();
    });

    afterEach(async () => {
        jest.clearAllMocks();
        await app.close();
    });

    it('POST /bookings should create booking successfully', async () => {
        bookingsServiceMock.create.mockResolvedValue({
            id: 101,
            code: 'BK000101',
            bookingStatus: BookingStatus.PENDING_PAYMENT,
            paymentStatus: PaymentStatus.UNPAID,
        });

        const payload = {
            tourId: 10,
            packageId: 20,
            departureId: 30,
            optionId: 40,
            adultCount: 2,
            childCount: 1,
            isPrivateGuide: false,
            contactName: 'Nguyen Van A',
            contactEmail: 'a@mail.com',
            contactPhone: '0123456789',
            notes: 'test booking',
        };

        const res = await request(app.getHttpServer())
            .post('/bookings')
            .send(payload)
            .expect(201);

        expect(bookingsServiceMock.create).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 1,
                email: 'test@example.com',
                name: 'Test User',
            }),
            expect.objectContaining({
                tourId: 10,
                packageId: 20,
                departureId: 30,
                optionId: 40,
            }),
        );

        expect(res.body).toEqual({
            id: 101,
            code: 'BK000101',
            bookingStatus: BookingStatus.PENDING_PAYMENT,
            paymentStatus: PaymentStatus.UNPAID,
        });
    });

    it('POST /bookings should return 400 when payload is invalid', async () => {
        await request(app.getHttpServer())
            .post('/bookings')
            .send({
                tourId: 0,
                packageId: 20,
                departureId: 30,
                optionId: 40,
                adultCount: 0,
                contactName: '',
                contactEmail: 'not-an-email',
            })
            .expect(400);

        expect(bookingsServiceMock.create).not.toHaveBeenCalled();
    });

    it('GET /bookings/my should return current user bookings', async () => {
        bookingsServiceMock.getMyBookings.mockResolvedValue({
            items: [
                {
                    id: 1,
                    code: 'BK000001',
                    bookingStatus: BookingStatus.PENDING_PAYMENT,
                    paymentStatus: PaymentStatus.UNPAID,
                },
            ],
            pagination: {
                page: 1,
                limit: 10,
                total: 1,
                totalPages: 1,
            },
        });

        const res = await request(app.getHttpServer())
            .get('/bookings/my?page=1&limit=10')
            .expect(200);

        expect(bookingsServiceMock.getMyBookings).toHaveBeenCalledWith(
            1,
            expect.objectContaining({
                page: 1,
                limit: 10,
            }),
        );

        expect(res.body.items).toHaveLength(1);
        expect(res.body.pagination.total).toBe(1);
    });

    it('POST /bookings/my/:id/pay should pay booking successfully', async () => {
        bookingsServiceMock.pay.mockResolvedValue({
            id: 1,
            bookingStatus: BookingStatus.CONFIRMED,
            paymentStatus: PaymentStatus.PAID,
            paymentMethod: PaymentMethod.CASH,
        });

        const res = await request(app.getHttpServer())
            .post('/bookings/my/1/pay')
            .send({
                paymentMethod: PaymentMethod.CASH,
            })
            .expect(201);

        expect(bookingsServiceMock.pay).toHaveBeenCalledWith(
            1,
            1,
            expect.objectContaining({
                paymentMethod: PaymentMethod.CASH,
            }),
        );

        expect(res.body).toEqual({
            id: 1,
            bookingStatus: BookingStatus.CONFIRMED,
            paymentStatus: PaymentStatus.PAID,
            paymentMethod: PaymentMethod.CASH,
        });
    });
});