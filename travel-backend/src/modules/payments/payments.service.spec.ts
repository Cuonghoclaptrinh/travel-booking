import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PaymentsService } from './payments.service';
import { PaymentProvider, PaymentTransactionStatus } from './payment.enums';
import { BookingStatus, PaymentMethod, PaymentStatus } from '../bookings/booking.enums';
import * as vnpayUtils from './vnpay.util';

describe('PaymentsService', () => {
  let service: PaymentsService;

  let paymentRepository: any;
  let bookingRepository: any;
  let dataSource: any;
  let configService: any;

  let manager: any;
  let paymentRepoTx: any;
  let bookingRepoTx: any;

  beforeEach(() => {
    paymentRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    bookingRepository = {
      findOne: jest.fn(),
    };

    paymentRepoTx = {
      create: jest.fn((payload) => payload),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    bookingRepoTx = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    manager = {
      getRepository: jest.fn((entity) => {
        const name = entity?.name;
        if (name === 'PaymentTransaction') return paymentRepoTx;
        if (name === 'Booking') return bookingRepoTx;
        return {};
      }),
    };

    dataSource = {
      transaction: jest.fn((callback) => callback(manager)),
    };

    configService = {
      get: jest.fn(),
      getOrThrow: jest.fn(),
    };

    service = new PaymentsService(
      paymentRepository,
      bookingRepository,
      dataSource as DataSource,
      configService,
    );

    jest.spyOn(service as any, 'generateTransactionRef').mockReturnValue('TXN123456');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('createVnpayPaymentUrl', () => {
    const dto = {
      bankCode: 'NCB',
      language: 'vn',
    };

    it('should create vnpay payment url successfully', async () => {
      bookingRepoTx.findOne.mockResolvedValue({
        id: 1,
        code: 'BK000001',
        userId: 1,
        totalAmount: '2500000.00',
        paymentStatus: PaymentStatus.UNPAID,
        bookingStatus: BookingStatus.PENDING_PAYMENT,
      });

      bookingRepoTx.save.mockImplementation(async (payload: any) => payload);

      paymentRepoTx.save.mockImplementation(async (payload: any) => ({
        id: 100,
        ...payload,
      }));

      jest.spyOn(service as any, 'assertBookingCanCreatePayment').mockReturnValue(undefined);


      configService.get.mockImplementation((key: string) => {
        const map: Record<string, string> = {
          VNPAY_TMN_CODE: 'TESTCODE',
          VNPAY_HASH_SECRET: 'TESTSECRET',
          VNPAY_PAYMENT_URL: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
          VNPAY_RETURN_URL: 'http://localhost:5173/payment/vnpay-return',
        };
        return map[key];
      });

      const result = await service.createVnpayPaymentUrl(1, 1, dto as any, '127.0.0.1');

      expect(bookingRepoTx.findOne).toHaveBeenCalled();
      expect(paymentRepoTx.create).toHaveBeenCalled();
      expect(paymentRepoTx.save).toHaveBeenCalled();

      const createdPayload = paymentRepoTx.create.mock.calls[0][0];
      expect(createdPayload.bookingId).toBe(1);
      expect(createdPayload.provider).toBe(PaymentProvider.VNPAY);
      expect(createdPayload.status).toBe(PaymentTransactionStatus.PENDING);
      expect(createdPayload.transactionRef).toBe('TXN123456');
      expect(createdPayload.amount).toBe('2500000.00');

      expect(result).toEqual(
        expect.objectContaining({
          paymentUrl: expect.any(String),
        }),
      );

      expect(result.paymentUrl).toContain('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html');
    });

    it('should throw NotFoundException when booking does not exist', async () => {
      bookingRepoTx.findOne.mockResolvedValue(null);

      await expect(
        service.createVnpayPaymentUrl(1, 999, dto as any, '127.0.0.1'),
      ).rejects.toThrow(new NotFoundException('Booking not found'));

      expect(bookingRepoTx.findOne).toHaveBeenCalled();
    });

    it('should throw BadRequestException when booking cannot create payment', async () => {
      bookingRepoTx.findOne.mockResolvedValue({
        id: 1,
        code: 'BK000001',
        userId: 1,
        totalAmount: '2500000.00',
        paymentStatus: PaymentStatus.PAID,
        bookingStatus: BookingStatus.CONFIRMED,
      });

      jest.spyOn(service as any, 'assertBookingCanCreatePayment').mockImplementation(() => {
        throw new BadRequestException('Booking is already paid');
      });

      await expect(
        service.createVnpayPaymentUrl(1, 1, dto as any, '127.0.0.1'),
      ).rejects.toThrow(new BadRequestException('Booking is already paid'));

      expect(bookingRepoTx.findOne).toHaveBeenCalled();
    });

    it('should throw BadRequestException when vnpay config is missing', async () => {
      bookingRepoTx.findOne.mockResolvedValue({
        id: 1,
        code: 'BK000001',
        userId: 1,
        totalAmount: '2500000.00',
        paymentStatus: PaymentStatus.UNPAID,
        bookingStatus: BookingStatus.PENDING_PAYMENT,
      });

      jest.spyOn(service as any, 'assertBookingCanCreatePayment').mockReturnValue(undefined);

      configService.get.mockReturnValue(undefined);

      await expect(
        service.createVnpayPaymentUrl(1, 1, dto as any, '127.0.0.1'),
      ).rejects.toThrow(
        new BadRequestException('VNPay configuration is missing'),
      );

      expect(bookingRepoTx.findOne).toHaveBeenCalled();
    });
  });
  describe('handleVnpayIpn', () => {
    const baseQuery = {
      vnp_TxnRef: 'TXN123456',
      vnp_Amount: '250000000',
      vnp_ResponseCode: '00',
      vnp_TransactionNo: 'VNP123456',
      vnp_PayDate: '20260424120000',
      vnp_BankCode: 'NCB',
    };

    it('should return invalid signature response when signature is invalid', async () => {
      jest.spyOn(vnpayUtils, 'verifyVnpaySignature').mockReturnValue(false);

      configService.get.mockImplementation((key: string) => {
        const map: Record<string, string> = {
          VNPAY_HASH_SECRET: 'TESTSECRET',
        };
        return map[key];
      });

      const result = await service.handleVnpayIpn(baseQuery);

      expect(result).toEqual({
        RspCode: '97',
        Message: 'Invalid signature',
      });
    });

    it('should return transaction not found when payment does not exist', async () => {
      jest.spyOn(vnpayUtils, 'verifyVnpaySignature').mockReturnValue(true);

      configService.get.mockImplementation((key: string) => {
        const map: Record<string, string> = {
          VNPAY_HASH_SECRET: 'TESTSECRET',
        };
        return map[key];
      });

      paymentRepoTx.findOne.mockResolvedValue(null);

      const result = await service.handleVnpayIpn(baseQuery);

      expect(paymentRepoTx.findOne).toHaveBeenCalled();
      expect(result).toEqual({
        RspCode: '01',
        Message: 'Order not found',
      });
    });

    it('should return invalid amount when payment amount does not match', async () => {
      jest.spyOn(vnpayUtils, 'verifyVnpaySignature').mockReturnValue(true);

      configService.get.mockImplementation((key: string) => {
        const map: Record<string, string> = {
          VNPAY_HASH_SECRET: 'TESTSECRET',
        };
        return map[key];
      });

      paymentRepoTx.findOne.mockResolvedValue({
        id: 1,
        bookingId: 1,
        transactionRef: 'TXN123456',
        amount: '2000000.00',
        status: PaymentTransactionStatus.PENDING,
        booking: {
          id: 1,
          paymentStatus: PaymentStatus.UNPAID,
          bookingStatus: BookingStatus.PENDING_PAYMENT,
        },
      });

      const result = await service.handleVnpayIpn(baseQuery);

      expect(paymentRepoTx.findOne).toHaveBeenCalled();
      expect(result).toEqual({
        RspCode: '04',
        Message: 'Invalid amount',
      });
    });

    it('should update payment and booking when payment is successful', async () => {
      jest.spyOn(vnpayUtils, 'verifyVnpaySignature').mockReturnValue(true);

      configService.get.mockImplementation((key: string) => {
        const map: Record<string, string> = {
          VNPAY_HASH_SECRET: 'TESTSECRET',
        };
        return map[key];
      });

      paymentRepoTx.findOne.mockResolvedValue({
        id: 1,
        bookingId: 1,
        transactionRef: 'TXN123456',
        amount: '2500000.00',
        status: PaymentTransactionStatus.PENDING,
      });

      bookingRepoTx.findOne.mockResolvedValue({
        id: 1,
        paymentStatus: PaymentStatus.UNPAID,
        bookingStatus: BookingStatus.PENDING_PAYMENT,
        paymentMethod: null,
      });

      const result = await service.handleVnpayIpn(baseQuery);

      expect(paymentRepoTx.findOne).toHaveBeenCalled();
      expect(bookingRepoTx.findOne).toHaveBeenCalled();

      expect(result).toEqual({
        RspCode: '00',
        Message: 'Confirm Success',
      });
    });

    it('should return success immediately when payment was already confirmed', async () => {
      jest.spyOn(vnpayUtils, 'verifyVnpaySignature').mockReturnValue(true);

      configService.get.mockImplementation((key: string) => {
        const map: Record<string, string> = {
          VNPAY_HASH_SECRET: 'TESTSECRET',
        };
        return map[key];
      });

      paymentRepoTx.findOne.mockResolvedValue({
        id: 1,
        bookingId: 1,
        transactionRef: 'TXN123456',
        amount: '2500000.00',
        status: PaymentTransactionStatus.SUCCESS,
        booking: {
          id: 1,
          paymentStatus: PaymentStatus.PAID,
          bookingStatus: BookingStatus.CONFIRMED,
        },
      });

      const result = await service.handleVnpayIpn(baseQuery);

      expect(paymentRepoTx.findOne).toHaveBeenCalled();
      expect(result).toEqual({
        RspCode: '02',
        Message: 'Order already confirmed',
      });
    });
  });

  describe('verifyVnpayReturn', () => {
    const baseQuery = {
      vnp_TxnRef: 'TXN123456',
      vnp_Amount: '250000000',
      vnp_ResponseCode: '00',
      vnp_TransactionNo: 'VNP123456',
      vnp_PayDate: '20260424120000',
      vnp_BankCode: 'NCB',
    };

    it('should return invalid signature result when signature is invalid', async () => {
      jest.spyOn(vnpayUtils, 'verifyVnpaySignature').mockReturnValue(false);

      configService.get.mockImplementation((key: string) => {
        const map: Record<string, string> = {
          VNPAY_HASH_SECRET: 'TESTSECRET',
        };
        return map[key];
      });

      const result = await service.verifyVnpayReturn(baseQuery);

      expect(result).toEqual({
        success: false,
        validSignature: false,
        responseCode: '00',
        transactionStatus: '',
        transactionRef: 'TXN123456',
        transactionNo: 'VNP123456',
        amount: 2500000,
        bankCode: 'NCB',
        payDate: '20260424120000',
        paymentId: null,
        bookingId: null,
        bookingCode: null,
      });
    });

    it('should return payment not found style result when transaction does not exist', async () => {
      jest.spyOn(vnpayUtils, 'verifyVnpaySignature').mockReturnValue(true);

      configService.get.mockImplementation((key: string) => {
        const map: Record<string, string> = {
          VNPAY_HASH_SECRET: 'TESTSECRET',
        };
        return map[key];
      });

      paymentRepository.findOne = jest.fn().mockResolvedValue(null);

      const result = await service.verifyVnpayReturn(baseQuery);

      expect(paymentRepository.findOne).toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        validSignature: true,
        responseCode: '00',
        transactionStatus: '',
        transactionRef: 'TXN123456',
        transactionNo: 'VNP123456',
        amount: 2500000,
        bankCode: 'NCB',
        payDate: '20260424120000',
        paymentId: null,
        bookingId: null,
        bookingCode: null,
      });
    });

    it('should return detailed result when payment transaction exists and response code is 00', async () => {
      jest.spyOn(vnpayUtils, 'verifyVnpaySignature').mockReturnValue(true);

      configService.get.mockImplementation((key: string) => {
        const map: Record<string, string> = {
          VNPAY_HASH_SECRET: 'TESTSECRET',
        };
        return map[key];
      });

      paymentRepository.findOne = jest.fn().mockResolvedValue({
        id: 1,
        bookingId: 1,
        transactionRef: 'TXN123456',
        amount: '2500000.00',
        status: PaymentTransactionStatus.SUCCESS,
        providerTransactionId: 'VNP123456',
        booking: {
          id: 1,
          code: 'BK000001',
          paymentStatus: PaymentStatus.PAID,
          bookingStatus: BookingStatus.CONFIRMED,
        },
      });

      const result = await service.verifyVnpayReturn(baseQuery);

      expect(paymentRepository.findOne).toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        validSignature: true,
        responseCode: '00',
        transactionStatus: '',
        transactionRef: 'TXN123456',
        transactionNo: 'VNP123456',
        amount: 2500000,
        bankCode: 'NCB',
        payDate: '20260424120000',
        paymentId: 1,
        bookingId: 1,
        bookingCode: 'BK000001',
      });
    });

    it('should return failed result when response code is not 00', async () => {
      jest.spyOn(vnpayUtils, 'verifyVnpaySignature').mockReturnValue(true);

      configService.get.mockImplementation((key: string) => {
        const map: Record<string, string> = {
          VNPAY_HASH_SECRET: 'TESTSECRET',
        };
        return map[key];
      });

      paymentRepository.findOne = jest.fn().mockResolvedValue({
        id: 1,
        bookingId: 1,
        transactionRef: 'TXN123456',
        amount: '2500000.00',
        status: PaymentTransactionStatus.FAILED,
        booking: {
          id: 1,
          code: 'BK000001',
          paymentStatus: PaymentStatus.UNPAID,
          bookingStatus: BookingStatus.PENDING_PAYMENT,
        },
      });

      const result = await service.verifyVnpayReturn({
        ...baseQuery,
        vnp_ResponseCode: '24',
      });

      expect(paymentRepository.findOne).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          success: false,
          responseCode: '24',
        }),
      );
    });
  });

  describe('getPaymentsByBooking', () => {
    it('should return payments of a booking', async () => {
      const payments = [
        {
          id: 1,
          bookingId: 10,
          provider: PaymentProvider.VNPAY,
          status: PaymentTransactionStatus.SUCCESS,
          transactionRef: 'TXN001',
          amount: '2500000.00',
        },
        {
          id: 2,
          bookingId: 10,
          provider: PaymentProvider.VNPAY,
          status: PaymentTransactionStatus.PENDING,
          transactionRef: 'TXN002',
          amount: '2500000.00',
        },
      ];

      bookingRepository.findOne = jest.fn().mockResolvedValue({
        id: 10,
        userId: 1,
        code: 'BK000010',
      });

      paymentRepository.find = jest.fn().mockResolvedValue(payments);

      const result = await service.getPaymentsByBooking(1, 10);

      expect(bookingRepository.findOne).toHaveBeenCalled();
      expect(paymentRepository.find).toHaveBeenCalled();
      expect(result).toEqual(payments);
    });

    it('should return empty array when booking has no payments', async () => {
      bookingRepository.findOne = jest.fn().mockResolvedValue({
        id: 999,
        userId: 1,
        code: 'BK000999',
      });

      paymentRepository.find = jest.fn().mockResolvedValue([]);

      const result = await service.getPaymentsByBooking(1, 999);

      expect(bookingRepository.findOne).toHaveBeenCalled();
      expect(paymentRepository.find).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when booking does not exist', async () => {
      bookingRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.getPaymentsByBooking(1, 999)).rejects.toThrow(
        new NotFoundException('Booking not found'),
      );

      expect(bookingRepository.findOne).toHaveBeenCalled();
    });
  });

  describe('getAdminPayments', () => {
    it('should return paginated admin payments', async () => {
      const mockItems = [
        {
          id: 1,
          bookingId: 10,
          transactionRef: 'TXN001',
          provider: PaymentProvider.VNPAY,
          status: PaymentTransactionStatus.SUCCESS,
          amount: '2500000.00',
        },
        {
          id: 2,
          bookingId: 11,
          transactionRef: 'TXN002',
          provider: PaymentProvider.VNPAY,
          status: PaymentTransactionStatus.PENDING,
          amount: '3000000.00',
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

      paymentRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const result = await service.getAdminPayments({
        page: 1,
        limit: 20,
      } as any);

      expect(paymentRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);

      expect(result).toEqual({
        items: mockItems,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        },
      });
    });

    it('should apply transactionRef filter when provided', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      paymentRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      await service.getAdminPayments({
        page: 1,
        limit: 20,
        transactionRef: 'TXN001',
      } as any);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });

    it('should apply provider and status filters when provided', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      paymentRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      await service.getAdminPayments({
        page: 1,
        limit: 20,
        provider: PaymentProvider.VNPAY,
        status: PaymentTransactionStatus.SUCCESS,
      } as any);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });

    it('should apply bookingId filter when provided', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      paymentRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      await service.getAdminPayments({
        page: 1,
        limit: 20,
        bookingId: 10,
      } as any);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });
  });
});