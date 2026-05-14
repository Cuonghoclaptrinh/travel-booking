import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(private readonly mailerService: MailerService) { }

    async sendPaymentSuccessEmail(payload: {
        to: string;
        customerName: string;
        bookingCode: string;
        tourName: string;
        amount: string | number;
        paymentMethod?: string;
        paidAt?: Date | string;
    }) {
        try {
            await this.mailerService.sendMail({
                to: payload.to,
                subject: `Xác nhận thanh toán thành công - ${payload.bookingCode}`,
                html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                        <h2>Thanh toán thành công</h2>

                        <p>Xin chào <b>${payload.customerName}</b>,</p>

                        <p>Cảm ơn bạn đã thanh toán cho booking <b>${payload.bookingCode}</b>.</p>

                        <table cellpadding="8" cellspacing="0" border="1" style="border-collapse: collapse;">
                            <tr>
                                <td><b>Mã booking</b></td>
                                <td>${payload.bookingCode}</td>
                            </tr>
                            <tr>
                                <td><b>Tour</b></td>
                                <td>${payload.tourName}</td>
                            </tr>
                            <tr>
                                <td><b>Số tiền</b></td>
                                <td>${Number(payload.amount).toLocaleString('vi-VN')} VND</td>
                            </tr>
                            <tr>
                                <td><b>Phương thức</b></td>
                                <td>${payload.paymentMethod || 'Online'}</td>
                            </tr>
                            <tr>
                                <td><b>Thời gian thanh toán</b></td>
                                <td>${payload.paidAt ? new Date(payload.paidAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN')}</td>
                            </tr>
                        </table>

                        <p>Chúng tôi sẽ liên hệ với bạn nếu cần thêm thông tin.</p>

                        <p>Trân trọng,<br/>Tour Travel</p>
                    </div>
                `,
            });
        } catch (error) {
            this.logger.error(
                `Send payment success email failed: ${payload.to}`,
                error instanceof Error ? error.stack : String(error),
            );
        }
    }

    async sendPaymentExpiredEmail(payload: {
        to: string;
        customerName: string;
        bookingCode: string;
        tourName: string;
        amount?: string | number;
        expiredAt?: Date | string;
    }) {
        try {
            await this.mailerService.sendMail({
                to: payload.to,
                subject: `Thanh toán đã hết hạn - ${payload.bookingCode}`,
                html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                        <h2>Thanh toán đã hết hạn</h2>

                        <p>Xin chào <b>${payload.customerName}</b>,</p>

                        <p>Booking <b>${payload.bookingCode}</b> của bạn đã hết hạn thanh toán.</p>

                        <table cellpadding="8" cellspacing="0" border="1" style="border-collapse: collapse;">
                            <tr>
                                <td><b>Mã booking</b></td>
                                <td>${payload.bookingCode}</td>
                            </tr>
                            <tr>
                                <td><b>Tour</b></td>
                                <td>${payload.tourName}</td>
                            </tr>
                            ${payload.amount
                        ? `
                            <tr>
                                <td><b>Số tiền</b></td>
                                <td>${Number(payload.amount).toLocaleString('vi-VN')} VND</td>
                            </tr>
                            `
                        : ''
                    }
                            <tr>
                                <td><b>Thời gian hết hạn</b></td>
                                <td>${payload.expiredAt ? new Date(payload.expiredAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN')}</td>
                            </tr>
                        </table>

                        <p>Nếu bạn vẫn muốn đặt tour này, vui lòng thực hiện đặt chỗ lại trên hệ thống.</p>

                        <p>Trân trọng,<br/>Tour Travel</p>
                    </div>
                `,
            });
        } catch (error) {
            this.logger.error(
                `Send payment expired email failed: ${payload.to}`,
                error instanceof Error ? error.stack : String(error),
            );
        }
    }
}