import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { VnpayController } from 'src/modules/payments/vnpay.controller';
import { PaymentsService } from 'src/modules/payments/payments.service';

describe('VnpayController (e2e)', () => {
    let app: INestApplication;

    const paymentsServiceMock = {
        handleVnpayIpn: jest.fn(),
        verifyVnpayReturn: jest.fn(),
    };

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [VnpayController],
            providers: [
                {
                    provide: PaymentsService,
                    useValue: paymentsServiceMock,
                },
            ],
        }).compile();

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

    it('GET /payments/vnpay/ipn should handle ipn successfully', async () => {
        paymentsServiceMock.handleVnpayIpn.mockResolvedValue({
            RspCode: '00',
            Message: 'Confirm Success',
        });

        const res = await request(app.getHttpServer())
            .get('/payments/vnpay/ipn')
            .query({
                vnp_TxnRef: 'TXN123456',
                vnp_Amount: '250000000',
                vnp_ResponseCode: '00',
            })
            .expect(200);

        expect(paymentsServiceMock.handleVnpayIpn).toHaveBeenCalledWith(
            expect.objectContaining({
                vnp_TxnRef: 'TXN123456',
                vnp_Amount: '250000000',
                vnp_ResponseCode: '00',
            }),
        );

        expect(res.body).toEqual({
            RspCode: '00',
            Message: 'Confirm Success',
        });
    });

    it('GET /payments/vnpay/return should verify return successfully', async () => {
        paymentsServiceMock.verifyVnpayReturn.mockResolvedValue({
            success: true,
            validSignature: true,
            responseCode: '00',
            transactionRef: 'TXN123456',
            paymentId: 1,
            bookingId: 1,
            bookingCode: 'BK000001',
        });

        const res = await request(app.getHttpServer())
            .get('/payments/vnpay/return')
            .query({
                vnp_TxnRef: 'TXN123456',
                vnp_Amount: '250000000',
                vnp_ResponseCode: '00',
            })
            .expect(200);

        expect(paymentsServiceMock.verifyVnpayReturn).toHaveBeenCalledWith(
            expect.objectContaining({
                vnp_TxnRef: 'TXN123456',
                vnp_Amount: '250000000',
                vnp_ResponseCode: '00',
            }),
        );

        expect(res.body).toEqual({
            success: true,
            validSignature: true,
            responseCode: '00',
            transactionRef: 'TXN123456',
            paymentId: 1,
            bookingId: 1,
            bookingCode: 'BK000001',
        });
    });
});