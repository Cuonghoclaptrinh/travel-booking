import { useEffect, useState } from 'react';
import {
    Button,
    Card,
    Descriptions,
    Divider,
    Empty,
    Space,
    Spin,
    Tag,
    Typography,
    message,
} from 'antd';
import { useNavigate, useParams } from 'react-router-dom';

import paymentService from '../../../services/admin/paymentService';
import {
    PaymentProvider,
    PaymentTransaction,
    PaymentTransactionStatus,
} from '../../../types/payment';

const { Title, Text, Paragraph } = Typography;

const providerColorMap: Record<PaymentProvider, string> = {
    vnpay: 'blue',
    momo: 'magenta',
    zalopay: 'cyan',
    bank_transfer: 'purple',
    cash: 'gold',
    mock: 'default',
};

const statusColorMap: Record<PaymentTransactionStatus, string> = {
    pending: 'orange',
    success: 'green',
    failed: 'red',
    cancelled: 'default',
    expired: 'volcano',
    refunded: 'geekblue',
};

const bookingStatusColorMap: Record<string, string> = {
    pending_payment: 'orange',
    confirmed: 'green',
    expired: 'red',
    cancelled: 'default',
};

const paymentStatusColorMap: Record<string, string> = {
    unpaid: 'orange',
    paid: 'green',
    expired: 'red',
    cancelled: 'default',
};

const formatMoney = (value?: string | number, currency = 'VND') => {
    return `${Number(value || 0).toLocaleString('vi-VN')} ${currency}`;
};

const formatDateTime = (value?: string) => {
    if (!value) return '-';
    return new Date(value).toLocaleString('vi-VN');
};

const formatJson = (value: any) => {
    if (!value) return '-';

    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
};

const AdminPaymentDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [payment, setPayment] = useState<PaymentTransaction | null>(null);

    const fetchDetail = async () => {
        if (!id) return;

        try {
            setLoading(true);
            const response = await paymentService.getAdminPaymentById(Number(id));
            setPayment(response);
        } catch (error: any) {
            message.error(
                error?.response?.data?.message ||
                'Không tải được chi tiết thanh toán',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [id]);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: 60 }}>
                <Spin />
            </div>
        );
    }

    if (!payment) {
        return (
            <div>
                <Button onClick={() => navigate(-1)}>Quay lại</Button>
                <Empty description="Không tìm thấy giao dịch thanh toán" />
            </div>
        );
    }

    const booking = payment.booking;
    const tour = booking?.tour;
    const tourPackage = booking?.tourPackage;
    const departure = booking?.departure;
    const option = booking?.departureOption;
    const user = booking?.user;

    return (
        <div>
            <Space style={{ marginBottom: 16 }}>
                <Button onClick={() => navigate(-1)}>Quay lại</Button>

                {booking?.id && (
                    <Button
                        type="primary"
                        onClick={() => navigate(`/admin/bookings`)}
                    >
                        Về danh sách booking
                    </Button>
                )}
            </Space>

            <Title level={3}>Chi tiết thanh toán #{payment.id}</Title>

            <Card style={{ marginBottom: 16 }}>
                <Title level={4}>Thông tin giao dịch</Title>

                <Descriptions bordered column={1}>
                    <Descriptions.Item label="Provider">
                        <Tag color={providerColorMap[payment.provider]}>
                            {payment.provider}
                        </Tag>
                    </Descriptions.Item>

                    <Descriptions.Item label="Trạng thái">
                        <Tag color={statusColorMap[payment.status]}>
                            {payment.status}
                        </Tag>
                    </Descriptions.Item>

                    <Descriptions.Item label="Mã giao dịch hệ thống">
                        {payment.transactionRef}
                    </Descriptions.Item>

                    <Descriptions.Item label="Mã giao dịch nhà cung cấp">
                        {payment.providerTransactionId || '-'}
                    </Descriptions.Item>

                    <Descriptions.Item label="Số tiền">
                        <Text strong>
                            {formatMoney(payment.amount, payment.currency)}
                        </Text>
                    </Descriptions.Item>

                    <Descriptions.Item label="Tiền tệ">
                        {payment.currency}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày tạo">
                        {formatDateTime(payment.createdAt)}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày thanh toán">
                        {formatDateTime(payment.paidAt)}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày hết hạn">
                        {formatDateTime(payment.expiredAt)}
                    </Descriptions.Item>

                    <Descriptions.Item label="Payment URL">
                        {payment.paymentUrl ? (
                            <Paragraph copyable ellipsis={{ rows: 2, expandable: true }}>
                                {payment.paymentUrl}
                            </Paragraph>
                        ) : (
                            '-'
                        )}
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            <Card style={{ marginBottom: 16 }}>
                <Title level={4}>Thông tin booking</Title>

                {booking ? (
                    <Descriptions bordered column={1}>
                        <Descriptions.Item label="Mã booking">
                            {booking.code}
                        </Descriptions.Item>

                        <Descriptions.Item label="Trạng thái booking">
                            <Tag
                                color={
                                    bookingStatusColorMap[booking.bookingStatus] ||
                                    'default'
                                }
                            >
                                {booking.bookingStatus}
                            </Tag>
                        </Descriptions.Item>

                        <Descriptions.Item label="Trạng thái thanh toán">
                            <Tag
                                color={
                                    paymentStatusColorMap[booking.paymentStatus] ||
                                    'default'
                                }
                            >
                                {booking.paymentStatus}
                            </Tag>
                        </Descriptions.Item>

                        <Descriptions.Item label="Người liên hệ">
                            {booking.contactName}
                        </Descriptions.Item>

                        <Descriptions.Item label="Email liên hệ">
                            {booking.contactEmail}
                        </Descriptions.Item>

                        <Descriptions.Item label="Số điện thoại">
                            {booking.contactPhone || '-'}
                        </Descriptions.Item>

                        <Descriptions.Item label="Số người lớn">
                            {booking.adultCount}
                        </Descriptions.Item>

                        <Descriptions.Item label="Số trẻ em">
                            {booking.childCount}
                        </Descriptions.Item>

                        <Descriptions.Item label="Số chỗ giữ">
                            {booking.reservedSlots}
                        </Descriptions.Item>

                        <Descriptions.Item label="HDV riêng">
                            {booking.isPrivateGuide ? 'Có' : 'Không'}
                        </Descriptions.Item>

                        <Descriptions.Item label="Đơn giá người lớn">
                            {formatMoney(booking.unitPriceAdult)}
                        </Descriptions.Item>

                        <Descriptions.Item label="Đơn giá trẻ em">
                            {formatMoney(booking.unitPriceChild)}
                        </Descriptions.Item>

                        <Descriptions.Item label="Phụ thu ngày đi">
                            {formatMoney(booking.departurePriceAdjustment)}
                        </Descriptions.Item>

                        <Descriptions.Item label="Phụ thu option">
                            {formatMoney(booking.optionExtraPrice)}
                        </Descriptions.Item>

                        <Descriptions.Item label="Phụ thu HDV">
                            {formatMoney(booking.guideExtraPrice)}
                        </Descriptions.Item>

                        <Descriptions.Item label="Tổng tiền booking">
                            <Text strong>
                                {formatMoney(booking.totalAmount)}
                            </Text>
                        </Descriptions.Item>

                        <Descriptions.Item label="Hết hạn thanh toán">
                            {formatDateTime(booking.expiresAt)}
                        </Descriptions.Item>

                        <Descriptions.Item label="Đã thanh toán lúc">
                            {formatDateTime(booking.paidAt)}
                        </Descriptions.Item>

                        <Descriptions.Item label="Ghi chú">
                            {booking.notes || '-'}
                        </Descriptions.Item>
                    </Descriptions>
                ) : (
                    <Empty description="Không có thông tin booking" />
                )}
            </Card>

            <Card style={{ marginBottom: 16 }}>
                <Title level={4}>Thông tin chuyến đi</Title>

                <Descriptions bordered column={1}>
                    <Descriptions.Item label="Tour">
                        {tour?.name || tour?.title || `Tour #${booking?.tourId || '-'}`}
                    </Descriptions.Item>

                    <Descriptions.Item label="Gói tour">
                        {tourPackage?.name ||
                            tourPackage?.title ||
                            `Package #${booking?.packageId || '-'}`}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày khởi hành">
                        {formatDateTime(
                            (departure as any)?.departureDate ||
                            (departure as any)?.startDate,
                        )}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày kết thúc">
                        {formatDateTime(
                            (departure as any)?.returnDate ||
                            (departure as any)?.endDate,
                        )}
                    </Descriptions.Item>

                    <Descriptions.Item label="Option">
                        {option?.name ||
                            option?.title ||
                            `Option #${booking?.optionId || '-'}`}
                    </Descriptions.Item>

                    <Descriptions.Item label="Thành phố khởi hành">
                        {(option as any)?.departureCity || '-'}
                    </Descriptions.Item>

                    <Descriptions.Item label="Phương tiện">
                        {(option as any)?.transportType || '-'}
                    </Descriptions.Item>

                    <Descriptions.Item label="Khách hàng hệ thống">
                        {user?.name || '-'} - {user?.email || '-'}
                    </Descriptions.Item>
                </Descriptions>
            </Card>
            {/* 
            <Card>
                <Title level={4}>Dữ liệu kỹ thuật</Title>

                <Divider orientation={'left' as any}>Raw request</Divider>
                <Paragraph>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>
                        {formatJson(payment.rawRequest)}
                    </pre>
                </Paragraph>

                <Divider orientation={'left' as any}>Raw response</Divider>
                <Paragraph>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>
                        {formatJson(payment.rawResponse)}
                    </pre>
                </Paragraph>

                <Divider orientation={'left' as any}>Raw IPN</Divider>
                <Paragraph>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>
                        {formatJson(payment.rawIpn)}
                    </pre>
                </Paragraph>
            </Card> */}
        </div>
    );
};

export default AdminPaymentDetailPage;