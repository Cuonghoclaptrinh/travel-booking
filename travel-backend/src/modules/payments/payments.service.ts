import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Booking } from '../bookings/entities/booking.entity';
import { BookingStatus, PaymentStatus } from '../bookings/booking.enums';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { PaymentProvider, PaymentTransactionStatus } from './payment.enums';
import { CreateVnpayPaymentUrlDto } from './dto/create-vnpay-payment-url.dto';
import {
  buildVnpayPaymentUrl,
  formatVnpayDate,
  verifyVnpaySignature,
} from './vnpay.util';
import { AdminQueryPaymentsDto } from './dto/admin-query-payments.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { MailService } from '../mail/mail.service';
import { PayosClient } from './payos.client';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentTransaction)
    private readonly paymentTransactionRepository: Repository<PaymentTransaction>,

    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,

    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly mailService: MailService,
    private readonly payosClient: PayosClient,
  ) { }

  async createVnpayPaymentUrl(
    userId: number,
    bookingId: number,
    dto: CreateVnpayPaymentUrlDto,
    ipAddr: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const bookingRepo = manager.getRepository(Booking);
      const paymentRepo = manager.getRepository(PaymentTransaction);

      const booking = await bookingRepo.findOne({
        where: {
          id: bookingId,
          userId,
        },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      this.assertBookingCanCreatePayment(booking);

      const tmnCode = this.configService.get<string>('VNPAY_TMN_CODE');
      const hashSecret = this.configService.get<string>('VNPAY_HASH_SECRET');
      const paymentUrl = this.configService.get<string>('VNPAY_PAYMENT_URL');
      const returnUrl = this.configService.get<string>('VNPAY_RETURN_URL');

      if (!tmnCode || !hashSecret || !paymentUrl || !returnUrl) {
        throw new BadRequestException('VNPay configuration is missing');
      }

      const now = new Date();
      const amount = Math.round(Number(booking.totalAmount));

      if (!amount || amount <= 0) {
        throw new BadRequestException('Invalid booking amount');
      }

      const transactionRef = this.generateTransactionRef(booking.code);
      const expiredAt =
        booking.expiresAt && booking.expiresAt.getTime() > now.getTime()
          ? booking.expiresAt
          : this.addMinutes(now, 15);

      const vnpParams: Record<string, string | number | undefined> = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: tmnCode,
        vnp_Locale: dto.language || 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: transactionRef,
        vnp_OrderInfo: `Thanh toan booking ${booking.code}`,
        vnp_OrderType: 'other',
        vnp_Amount: amount * 100,
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: this.normalizeIp(ipAddr),
        vnp_CreateDate: formatVnpayDate(now),
        vnp_ExpireDate: formatVnpayDate(expiredAt),
      };

      if (dto.bankCode) {
        vnpParams.vnp_BankCode = dto.bankCode;
      }

      const redirectUrl = buildVnpayPaymentUrl(
        paymentUrl,
        vnpParams,
        hashSecret,
      );

      const payment = paymentRepo.create({
        bookingId: booking.id,
        provider: PaymentProvider.VNPAY,
        status: PaymentTransactionStatus.PENDING,
        transactionRef,
        amount: amount.toFixed(2),
        currency: 'VND',
        paymentUrl: redirectUrl,
        rawRequest: vnpParams,
        expiredAt,
      });

      await paymentRepo.save(payment);

      return {
        paymentUrl: redirectUrl,
        paymentId: payment.id,
        transactionRef,
        bookingId: booking.id,
        bookingCode: booking.code,
        amount,
        expiresAt: expiredAt,
      };
    });
  }

  async handleVnpayIpn(query: Record<string, any>) {
    try {
      const hashSecret = this.configService.get<string>('VNPAY_HASH_SECRET');

      if (!hashSecret) {
        return {
          RspCode: '99',
          Message: 'VNPay configuration is missing',
        };
      }

      const validSignature = verifyVnpaySignature(query, hashSecret);

      if (!validSignature) {
        return {
          RspCode: '97',
          Message: 'Invalid signature',
        };
      }

      const transactionRef = String(query.vnp_TxnRef || '');
      const vnpAmount = Number(query.vnp_Amount || 0);
      const responseCode = String(query.vnp_ResponseCode || '');
      const transactionStatus = String(query.vnp_TransactionStatus || '');
      const providerTransactionId = String(query.vnp_TransactionNo || '');

      if (!transactionRef) {
        return {
          RspCode: '01',
          Message: 'Order not found',
        };
      }

      let paymentSuccessEmailPayload:
        | {
          to: string;
          customerName: string;
          bookingCode: string;
          tourName: string;
          amount: string | number;
          paymentMethod?: string;
          paidAt?: Date | string;
        }
        | null = null;

      const result = await this.dataSource.transaction(async (manager) => {
        const bookingRepo = manager.getRepository(Booking);
        const paymentRepo = manager.getRepository(PaymentTransaction);

        const payment = await paymentRepo.findOne({
          where: {
            transactionRef,
          },
          relations: {
            booking: true,
          },
        });

        if (!payment) {
          return {
            RspCode: '01',
            Message: 'Order not found',
          };
        }

        const expectedAmount = Math.round(Number(payment.amount)) * 100;

        if (vnpAmount !== expectedAmount) {
          payment.rawIpn = query;
          payment.status = PaymentTransactionStatus.FAILED;
          await paymentRepo.save(payment);

          return {
            RspCode: '04',
            Message: 'Invalid amount',
          };
        }

        if (payment.status === PaymentTransactionStatus.SUCCESS) {
          return {
            RspCode: '02',
            Message: 'Order already confirmed',
          };
        }

        const booking = await bookingRepo.findOne({
          where: {
            id: payment.bookingId,
          },
          relations: {
            user: true,
            tour: true,
          },
        });

        if (!booking) {
          return {
            RspCode: '01',
            Message: 'Booking not found',
          };
        }

        payment.rawIpn = query;
        payment.providerTransactionId = providerTransactionId || undefined;

        if (responseCode === '00' && transactionStatus === '00') {
          const paidAt = new Date();

          payment.status = PaymentTransactionStatus.SUCCESS;
          payment.paidAt = paidAt;

          booking.paymentStatus = PaymentStatus.PAID;
          booking.bookingStatus = BookingStatus.CONFIRMED;
          booking.paymentMethod = PaymentProvider.VNPAY as any;
          booking.paymentReference = providerTransactionId || transactionRef;
          booking.paidAt = paidAt;

          await paymentRepo.save(payment);
          await bookingRepo.save(booking);

          this.realtimeGateway.emitPaymentUpdatedToUser(booking.userId, {
            bookingId: booking.id,
            bookingCode: booking.code,
            paymentId: payment.id,
            transactionRef: payment.transactionRef,
            providerTransactionId: payment.providerTransactionId,
            paymentStatus: booking.paymentStatus,
            bookingStatus: booking.bookingStatus,
            paymentMethod: booking.paymentMethod,
            message: 'Payment successful',
          });

          this.realtimeGateway.emitBookingUpdatedToUser(booking.userId, {
            bookingId: booking.id,
            bookingCode: booking.code,
            bookingStatus: booking.bookingStatus,
            paymentStatus: booking.paymentStatus,
          });

          const emailTo = booking.contactEmail || booking.user?.email;

          if (emailTo) {
            paymentSuccessEmailPayload = {
              to: emailTo,
              customerName:
                booking.contactName || booking.user?.name || 'Quý khách',
              bookingCode: booking.code,
              tourName: booking.tour?.name || 'Tour du lịch',
              amount: payment.amount,
              paymentMethod: PaymentProvider.VNPAY,
              paidAt,
            };
          }

          return {
            RspCode: '00',
            Message: 'Confirm Success',
          };
        }

        payment.status = PaymentTransactionStatus.FAILED;
        await paymentRepo.save(payment);

        this.realtimeGateway.emitPaymentUpdatedToUser(booking.userId, {
          bookingId: booking.id,
          bookingCode: booking.code,
          paymentId: payment.id,
          transactionRef: payment.transactionRef,
          providerTransactionId: payment.providerTransactionId,
          paymentStatus: booking.paymentStatus,
          bookingStatus: booking.bookingStatus,
          paymentMethod: booking.paymentMethod,
          message: 'Payment failed',
        });

        return {
          RspCode: '00',
          Message: 'Confirm Success',
        };
      });

      if (paymentSuccessEmailPayload) {
        void this.mailService.sendPaymentSuccessEmail(paymentSuccessEmailPayload);
      }

      return result;
    } catch {
      return {
        RspCode: '99',
        Message: 'Unknown error',
      };
    }
  }

  async verifyVnpayReturn(query: Record<string, any>) {
    const hashSecret = this.configService.get<string>('VNPAY_HASH_SECRET');

    if (!hashSecret) {
      throw new BadRequestException('VNPay configuration is missing');
    }

    const validSignature = verifyVnpaySignature(query, hashSecret);

    const transactionRef = String(query.vnp_TxnRef || '');
    const responseCode = String(query.vnp_ResponseCode || '');
    const transactionStatus = String(query.vnp_TransactionStatus || '');

    const payment = transactionRef
      ? await this.paymentTransactionRepository.findOne({
        where: {
          transactionRef,
        },
        relations: {
          booking: true,
        },
      })
      : null;

    return {
      validSignature,
      success:
        validSignature &&
        responseCode === '00' &&
        transactionStatus === '00',
      responseCode,
      transactionStatus,
      transactionRef,
      paymentId: payment?.id ?? null,
      bookingId: payment?.bookingId ?? null,
      bookingCode: payment?.booking?.code ?? null,
      amount: query.vnp_Amount ? Number(query.vnp_Amount) / 100 : null,
      transactionNo: query.vnp_TransactionNo ?? null,
      bankCode: query.vnp_BankCode ?? null,
      payDate: query.vnp_PayDate ?? null,
    };
  }

  async createPayosPaymentUrl(userId: number, bookingId: number) {
    const bookingRepo = this.dataSource.getRepository(Booking);
    const paymentRepo = this.dataSource.getRepository(PaymentTransaction);

    const booking = await bookingRepo.findOne({
      where: {
        id: bookingId,
        userId,
      },
      relations: {
        tour: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Booking has already been paid');
    }

    if (
      booking.bookingStatus === BookingStatus.CANCELLED ||
      booking.bookingStatus === BookingStatus.EXPIRED
    ) {
      throw new BadRequestException('Cannot pay cancelled or expired booking');
    }

    const amount = Math.round(Number(booking.totalAmount || 0));

    if (!amount || amount <= 0) {
      throw new BadRequestException('Invalid payment amount');
    }

    const orderCode = Date.now();

    const payment = paymentRepo.create({
      bookingId: booking.id,
      provider: PaymentProvider.PAYOS,
      status: PaymentTransactionStatus.PENDING,
      transactionRef: String(orderCode),
      amount: String(amount),
      currency: 'VND',
    });

    await paymentRepo.save(payment);

    const returnBaseUrl = this.configService.get<string>('PAYOS_RETURN_URL');
    const cancelBaseUrl = this.configService.get<string>('PAYOS_CANCEL_URL');

    if (!returnBaseUrl || !cancelBaseUrl) {
      throw new BadRequestException('Missing payOS return/cancel URL');
    }

    const paymentLink = await this.payosClient.createPaymentLink({
      orderCode,
      amount,
      description: `Booking ${booking.code}`.slice(0, 25),
      items: [
        {
          name: booking.tour?.name?.slice(0, 50) || booking.code,
          quantity: 1,
          price: amount,
        },
      ],
      returnUrl: `${returnBaseUrl}/${booking.id}`,

      cancelUrl: `${cancelBaseUrl}/${booking.id}`,
    });

    payment.paymentUrl = paymentLink.checkoutUrl;
    await paymentRepo.save(payment);

    return {
      paymentId: payment.id,
      bookingId: booking.id,
      bookingCode: booking.code,
      provider: PaymentProvider.PAYOS,
      transactionRef: payment.transactionRef,
      amount,
      checkoutUrl: paymentLink.checkoutUrl,
    };
  }

  // async handlePayosWebhook(body: any) {
  //   let verifiedData: any;

  //   try {
  //     verifiedData = this.payosClient.verifyWebhook(body);
  //   } catch {
  //     return {
  //       success: false,
  //       message: 'Invalid payOS webhook signature',
  //     };
  //   }

  //   const orderCode = verifiedData?.orderCode || body?.data?.orderCode;

  //   if (!orderCode) {
  //     return {
  //       success: false,
  //       message: 'Missing orderCode',
  //     };
  //   }

  //   let emailPayload:
  //     | {
  //       to: string;
  //       customerName: string;
  //       bookingCode: string;
  //       tourName: string;
  //       amount: string | number;
  //       paymentMethod?: string;
  //       paidAt?: Date | string;
  //     }
  //     | null = null;

  //   const result = await this.dataSource.transaction(async (manager) => {
  //     const bookingRepo = manager.getRepository(Booking);
  //     const paymentRepo = manager.getRepository(PaymentTransaction);

  //     const payment = await paymentRepo.findOne({
  //       where: {
  //         transactionRef: String(orderCode),
  //         provider: PaymentProvider.PAYOS,
  //       },
  //     });

  //     if (!payment) {
  //       return {
  //         success: false,
  //         message: 'Payment transaction not found',
  //       };
  //     }

  //     if (payment.status === PaymentTransactionStatus.SUCCESS) {
  //       return {
  //         success: true,
  //         message: 'Payment already confirmed',
  //       };
  //     }

  //     const booking = await bookingRepo.findOne({
  //       where: {
  //         id: payment.bookingId,
  //       },
  //       relations: {
  //         user: true,
  //         tour: true,
  //       },
  //     });

  //     if (!booking) {
  //       return {
  //         success: false,
  //         message: 'Booking not found',
  //       };
  //     }

  //     const isSuccess =
  //       body?.success === true &&
  //       String(body?.code) === '00';

  //     payment.rawIpn = body;
  //     payment.providerTransactionId =
  //       verifiedData?.reference ||
  //       body?.data?.reference ||
  //       body?.data?.paymentLinkId ||
  //       undefined;

  //     if (!isSuccess) {
  //       payment.status = PaymentTransactionStatus.FAILED;
  //       await paymentRepo.save(payment);

  //       this.realtimeGateway.emitPaymentUpdatedToUser(booking.userId, {
  //         bookingId: booking.id,
  //         bookingCode: booking.code,
  //         paymentId: payment.id,
  //         transactionRef: payment.transactionRef,
  //         providerTransactionId: payment.providerTransactionId,
  //         paymentStatus: booking.paymentStatus,
  //         bookingStatus: booking.bookingStatus,
  //         paymentMethod: booking.paymentMethod,
  //         message: 'payOS payment failed',
  //       });

  //       return {
  //         success: true,
  //         message: 'Payment failed handled',
  //       };
  //     }

  //     const paidAt = new Date();

  //     payment.status = PaymentTransactionStatus.SUCCESS;
  //     payment.paidAt = paidAt;

  //     booking.paymentStatus = PaymentStatus.PAID;
  //     booking.bookingStatus = BookingStatus.CONFIRMED;
  //     booking.paymentMethod = PaymentProvider.PAYOS as any;
  //     booking.paymentReference =
  //       payment.providerTransactionId || payment.transactionRef;
  //     booking.paidAt = paidAt;

  //     await paymentRepo.save(payment);
  //     await bookingRepo.save(booking);

  //     this.realtimeGateway.emitPaymentUpdatedToUser(booking.userId, {
  //       bookingId: booking.id,
  //       bookingCode: booking.code,
  //       paymentId: payment.id,
  //       transactionRef: payment.transactionRef,
  //       providerTransactionId: payment.providerTransactionId,
  //       paymentStatus: booking.paymentStatus,
  //       bookingStatus: booking.bookingStatus,
  //       paymentMethod: booking.paymentMethod,
  //       message: 'payOS payment successful',
  //     });

  //     this.realtimeGateway.emitBookingUpdatedToUser(booking.userId, {
  //       bookingId: booking.id,
  //       bookingCode: booking.code,
  //       bookingStatus: booking.bookingStatus,
  //       paymentStatus: booking.paymentStatus,
  //     });

  //     const emailTo = booking.contactEmail || booking.user?.email;

  //     if (emailTo) {
  //       emailPayload = {
  //         to: emailTo,
  //         customerName:
  //           booking.contactName || booking.user?.name || 'Quý khách',
  //         bookingCode: booking.code,
  //         tourName: booking.tour?.name || 'Tour du lịch',
  //         amount: payment.amount,
  //         paymentMethod: PaymentProvider.PAYOS,
  //         paidAt,
  //       };
  //     }

  //     return {
  //       success: true,
  //       message: 'Payment confirmed',
  //     };
  //   });

  //   if (emailPayload) {
  //     void this.mailService.sendPaymentSuccessEmail(emailPayload);
  //   }

  //   return result;
  // }

  async handlePayosWebhook(body: any) {
    console.log('PAYOS WEBHOOK BODY:', JSON.stringify(body, null, 2));

    let verifiedData: any;

    try {
      verifiedData = this.payosClient.verifyWebhook(body);
      console.log('PAYOS VERIFIED DATA:', JSON.stringify(verifiedData, null, 2));
    } catch (error: any) {
      console.error('PAYOS VERIFY ERROR:', error?.message || error);

      return {
        success: false,
        message: 'Invalid payOS webhook signature',
      };
    }

    const orderCode =
      verifiedData?.orderCode ||
      body?.data?.orderCode;

    if (!orderCode) {
      return {
        success: false,
        message: 'Missing orderCode',
      };
    }

    let emailPayload:
      | {
        to: string;
        customerName: string;
        bookingCode: string;
        tourName: string;
        amount: string | number;
        paymentMethod?: string;
        paidAt?: Date | string;
      }
      | null = null;

    const result = await this.dataSource.transaction(async (manager) => {
      const bookingRepo = manager.getRepository(Booking);
      const paymentRepo = manager.getRepository(PaymentTransaction);

      const payment = await paymentRepo.findOne({
        where: {
          transactionRef: String(orderCode),
          provider: PaymentProvider.PAYOS,
        },
      });

      console.log('PAYOS ORDER CODE:', orderCode);
      console.log('FOUND PAYMENT:', payment?.id || null);

      if (!payment) {
        return {
          success: false,
          message: 'Payment transaction not found',
        };
      }

      if (payment.status === PaymentTransactionStatus.SUCCESS) {
        return {
          success: true,
          message: 'Payment already confirmed',
        };
      }

      const booking = await bookingRepo.findOne({
        where: {
          id: payment.bookingId,
        },
        relations: {
          user: true,
          tour: true,
        },
      });

      if (!booking) {
        return {
          success: false,
          message: 'Booking not found',
        };
      }

      const isSuccess =
        body?.success === true &&
        String(body?.code) === '00';

      payment.rawIpn = body;
      payment.providerTransactionId =
        verifiedData?.reference ||
        body?.data?.reference ||
        body?.data?.paymentLinkId ||
        undefined;

      if (!isSuccess) {
        payment.status = PaymentTransactionStatus.FAILED;
        await paymentRepo.save(payment);

        try {
          const payload = {
            bookingId: booking.id,
            bookingCode: booking.code,
            paymentId: payment.id,
            transactionRef: payment.transactionRef,
            providerTransactionId: payment.providerTransactionId,
            paymentStatus: booking.paymentStatus,
            bookingStatus: booking.bookingStatus,
            paymentMethod: booking.paymentMethod,
            message: 'payOS payment failed',
          };

          this.realtimeGateway.emitPaymentUpdatedToUser(booking.userId, payload);
          this.realtimeGateway.emitPaymentUpdatedToAdmin(payload);
        } catch (error) {
          console.error('SOCKET EMIT ERROR:', error);
        }

        return {
          success: true,
          message: 'Payment failed handled',
        };
      }

      const paidAt = new Date();

      payment.status = PaymentTransactionStatus.SUCCESS;
      payment.paidAt = paidAt;

      booking.paymentStatus = PaymentStatus.PAID;
      booking.bookingStatus = BookingStatus.CONFIRMED;
      booking.paymentMethod = PaymentProvider.PAYOS as any;
      booking.paymentReference =
        payment.providerTransactionId || payment.transactionRef;
      booking.paidAt = paidAt;

      await paymentRepo.save(payment);
      await bookingRepo.save(booking);

      try {
        const payload = {
          bookingId: booking.id,
          bookingCode: booking.code,
          paymentId: payment.id,
          transactionRef: payment.transactionRef,
          providerTransactionId: payment.providerTransactionId,
          paymentStatus: booking.paymentStatus,
          bookingStatus: booking.bookingStatus,
          paymentMethod: booking.paymentMethod,
          message: 'payOS payment successful',
        };

        this.realtimeGateway.emitPaymentUpdatedToUser(booking.userId, payload);
        this.realtimeGateway.emitPaymentUpdatedToAdmin(payload);

        this.realtimeGateway.emitBookingUpdatedToUser(booking.userId, {
          bookingId: booking.id,
          bookingCode: booking.code,
          bookingStatus: booking.bookingStatus,
          paymentStatus: booking.paymentStatus,
        });
      } catch (error) {
        console.error('SOCKET EMIT ERROR:', error);
      }

      const emailTo = booking.contactEmail || booking.user?.email;

      if (emailTo) {
        emailPayload = {
          to: emailTo,
          customerName:
            booking.contactName || booking.user?.name || 'Quý khách',
          bookingCode: booking.code,
          tourName: booking.tour?.name || 'Tour du lịch',
          amount: payment.amount,
          paymentMethod: PaymentProvider.PAYOS,
          paidAt,
        };
      }

      return {
        success: true,
        message: 'Payment confirmed',
      };
    });

    if (emailPayload) {
      this.mailService
        .sendPaymentSuccessEmail(emailPayload)
        .catch((error) => {
          console.error('SEND PAYMENT EMAIL ERROR:', error);
        });
    }

    return result;
  }

  async getPaymentsByBooking(userId: number, bookingId: number) {
    const booking = await this.bookingRepository.findOne({
      where: {
        id: bookingId,
        userId,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return this.paymentTransactionRepository.find({
      where: {
        bookingId,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async createMockPayosPaymentUrl(userId: number, bookingId: number) {
    const bookingRepo = this.dataSource.getRepository(Booking);
    const paymentRepo = this.dataSource.getRepository(PaymentTransaction);

    const booking = await bookingRepo.findOne({
      where: {
        id: bookingId,
        userId,
      },
      relations: {
        tour: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Booking has already been paid');
    }

    if (
      booking.bookingStatus === BookingStatus.CANCELLED ||
      booking.bookingStatus === BookingStatus.EXPIRED
    ) {
      throw new BadRequestException('Cannot pay cancelled or expired booking');
    }

    const amount = Math.round(Number(booking.totalAmount || 0));

    if (!amount || amount <= 0) {
      throw new BadRequestException('Invalid payment amount');
    }

    const transactionRef = `MOCK_PAYOS_${booking.id}_${Date.now()}`;

    const payment = paymentRepo.create({
      bookingId: booking.id,
      provider: PaymentProvider.PAYOS,
      status: PaymentTransactionStatus.PENDING,
      transactionRef,
      amount: String(amount),
      currency: 'VND',
    });

    await paymentRepo.save(payment);

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:5173';

    const checkoutUrl = `${frontendUrl}/payment/mock-payos?transactionRef=${encodeURIComponent(
      transactionRef,
    )}`;

    payment.paymentUrl = checkoutUrl;
    await paymentRepo.save(payment);

    return {
      paymentId: payment.id,
      bookingId: booking.id,
      bookingCode: booking.code,
      provider: PaymentProvider.PAYOS,
      transactionRef,
      amount,
      checkoutUrl,
    };
  }

  async confirmMockPayosPayment(transactionRef: string) {
    let emailPayload:
      | {
        to: string;
        customerName: string;
        bookingCode: string;
        tourName: string;
        amount: string | number;
        paymentMethod?: string;
        paidAt?: Date | string;
      }
      | null = null;

    const result = await this.dataSource.transaction(async (manager) => {
      const bookingRepo = manager.getRepository(Booking);
      const paymentRepo = manager.getRepository(PaymentTransaction);

      const payment = await paymentRepo.findOne({
        where: {
          transactionRef,
          provider: PaymentProvider.PAYOS,
        },
      });

      if (!payment) {
        throw new NotFoundException('Payment transaction not found');
      }

      if (payment.status === PaymentTransactionStatus.SUCCESS) {
        return {
          success: true,
          message: 'Payment already confirmed',
          paymentId: payment.id,
          bookingId: payment.bookingId,
        };
      }

      if (
        payment.status === PaymentTransactionStatus.CANCELLED ||
        payment.status === PaymentTransactionStatus.EXPIRED
      ) {
        throw new BadRequestException(
          'Cannot confirm cancelled or expired payment',
        );
      }

      const booking = await bookingRepo.findOne({
        where: {
          id: payment.bookingId,
        },
        relations: {
          user: true,
          tour: true,
        },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      if (
        booking.bookingStatus === BookingStatus.CANCELLED ||
        booking.bookingStatus === BookingStatus.EXPIRED
      ) {
        throw new BadRequestException(
          'Cannot confirm cancelled or expired booking',
        );
      }

      const paidAt = new Date();

      payment.status = PaymentTransactionStatus.SUCCESS;
      payment.providerTransactionId = `DEMO_${Date.now()}`;
      payment.paidAt = paidAt;
      payment.rawIpn = {
        provider: 'mock_payos',
        transactionRef,
        paidAt,
      };

      booking.paymentStatus = PaymentStatus.PAID;
      booking.bookingStatus = BookingStatus.CONFIRMED;
      booking.paymentMethod = PaymentProvider.PAYOS as any;
      booking.paymentReference =
        payment.providerTransactionId || payment.transactionRef;
      booking.paidAt = paidAt;

      await paymentRepo.save(payment);
      await bookingRepo.save(booking);


      console.log('EMIT PAYMENT', {
        userId: booking.userId,
        bookingId: booking.id,
      });
      this.realtimeGateway.emitPaymentUpdatedToUser(booking.userId, {
        bookingId: booking.id,
        bookingCode: booking.code,
        paymentId: payment.id,
        transactionRef: payment.transactionRef,
        providerTransactionId: payment.providerTransactionId,
        paymentStatus: booking.paymentStatus,
        bookingStatus: booking.bookingStatus,
        paymentMethod: booking.paymentMethod,
        message: 'payOS demo payment successful',

      });

      this.realtimeGateway.emitBookingUpdatedToUser(booking.userId, {
        bookingId: booking.id,
        bookingCode: booking.code,
        bookingStatus: booking.bookingStatus,
        paymentStatus: booking.paymentStatus,
      });

      const emailTo = booking.contactEmail || booking.user?.email;

      if (emailTo) {
        emailPayload = {
          to: emailTo,
          customerName:
            booking.contactName || booking.user?.name || 'Quý khách',
          bookingCode: booking.code,
          tourName: booking.tour?.name || 'Tour du lịch',
          amount: payment.amount,
          paymentMethod: PaymentProvider.PAYOS,
          paidAt,
        };
      }

      return {
        success: true,
        message: 'Payment confirmed',
        paymentId: payment.id,
        bookingId: booking.id,
        bookingCode: booking.code,
      };
    });

    if (emailPayload) {
      void this.mailService.sendPaymentSuccessEmail(emailPayload);
    }

    return result;
  }

  private assertBookingCanCreatePayment(booking: Booking) {
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

    if (booking.bookingStatus !== BookingStatus.PENDING_PAYMENT) {
      throw new BadRequestException(
        'Only pending payment booking can be paid',
      );
    }

    if (booking.expiresAt && booking.expiresAt.getTime() < now.getTime()) {
      throw new BadRequestException('Booking payment window has expired');
    }
  }

  private generateTransactionRef(bookingCode: string): string {
    const random = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0');

    return `${bookingCode}-${Date.now()}-${random}`;
  }

  private addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60 * 1000);
  }

  private normalizeIp(ipAddr: string): string {
    if (!ipAddr) return '127.0.0.1';

    return ipAddr.replace('::ffff:', '').replace('::1', '127.0.0.1');
  }

  async getAdminPayments(query: AdminQueryPaymentsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.paymentTransactionRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.booking', 'booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.tour', 'tour')
      .leftJoinAndSelect('booking.tourPackage', 'tourPackage')
      .leftJoinAndSelect('booking.departure', 'departure')
      .leftJoinAndSelect('booking.departureOption', 'departureOption')
      .orderBy('payment.createdAt', 'DESC');

    if (query.transactionRef?.trim()) {
      qb.andWhere('payment.transactionRef LIKE :transactionRef', {
        transactionRef: `%${query.transactionRef.trim()}%`,
      });
    }

    if (query.providerTransactionId?.trim()) {
      qb.andWhere('payment.providerTransactionId LIKE :providerTransactionId', {
        providerTransactionId: `%${query.providerTransactionId.trim()}%`,
      });
    }

    if (query.bookingId) {
      qb.andWhere('payment.bookingId = :bookingId', {
        bookingId: query.bookingId,
      });
    }

    if (query.bookingCode?.trim()) {
      qb.andWhere('booking.code LIKE :bookingCode', {
        bookingCode: `%${query.bookingCode.trim()}%`,
      });
    }

    if (query.userId) {
      qb.andWhere('booking.userId = :userId', {
        userId: query.userId,
      });
    }

    if (query.tourId) {
      qb.andWhere('booking.tourId = :tourId', {
        tourId: query.tourId,
      });
    }

    if (query.provider) {
      qb.andWhere('payment.provider = :provider', {
        provider: query.provider,
      });
    }

    if (query.status) {
      qb.andWhere('payment.status = :status', {
        status: query.status,
      });
    }

    if (query.createdFrom) {
      qb.andWhere('payment.createdAt >= :createdFrom', {
        createdFrom: new Date(query.createdFrom),
      });
    }

    if (query.createdTo) {
      const end = new Date(query.createdTo);
      end.setHours(23, 59, 59, 999);

      qb.andWhere('payment.createdAt <= :createdTo', {
        createdTo: end,
      });
    }

    if (query.paidFrom) {
      qb.andWhere('payment.paidAt >= :paidFrom', {
        paidFrom: new Date(query.paidFrom),
      });
    }

    if (query.paidTo) {
      const end = new Date(query.paidTo);
      end.setHours(23, 59, 59, 999);

      qb.andWhere('payment.paidAt <= :paidTo', {
        paidTo: end,
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

  async getAdminPaymentById(id: number) {
    const payment = await this.paymentTransactionRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.booking', 'booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.tour', 'tour')
      .leftJoinAndSelect('booking.tourPackage', 'tourPackage')
      .leftJoinAndSelect('booking.departure', 'departure')
      .leftJoinAndSelect('booking.departureOption', 'departureOption')
      .where('payment.id = :id', { id })
      .getOne();

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async getPaymentsByBookingForAdmin(bookingId: number) {
    return this.paymentTransactionRepository.find({
      where: {
        bookingId,
      },
      relations: {
        booking: {
          user: true,
          tour: true,
          tourPackage: true,
          departure: true,
          departureOption: true,
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }
}