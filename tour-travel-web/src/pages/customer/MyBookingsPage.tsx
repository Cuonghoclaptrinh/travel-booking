// import { useEffect, useState } from 'react';
// import { Button, Card, Col, Empty, Row, Select, Space, Tag, Typography, message } from 'antd';
// import { useNavigate } from 'react-router-dom';
// import bookingService from '../../services/public/bookingService';
// import { Booking, BookingStatus, MyBookingQueryParams, PaymentStatus } from '../../types/booking';
// import { socket } from '../../socket';
// import { useUserSocket } from '../../hooks/useUserSocket';
// import { useAuth } from '../../hooks/useAuth';

// const { Title, Text } = Typography;
// const { Option } = Select;

// const formatMoney = (value?: string | number) =>
//     Number(value || 0).toLocaleString('vi-VN');

// const MyBookingsPage = () => {

//     const navigate = useNavigate();
//     const [loading, setLoading] = useState(false);
//     const [items, setItems] = useState<Booking[]>([]);
//     const [bookingStatus, setBookingStatus] = useState<BookingStatus | undefined>();
//     const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | undefined>();

//     const [bookings, setBookings] = useState<Booking[]>([]);

//     const fetchData = async () => {
//         try {
//             setLoading(true);

//             const params: MyBookingQueryParams = {
//                 page: 1,
//                 limit: 20,
//             };

//             if (bookingStatus) {
//                 params.bookingStatus = bookingStatus;
//             }

//             if (paymentStatus) {
//                 params.paymentStatus = paymentStatus;
//             }

//             const response = await bookingService.getMyBookings(params);
//             setItems(response.items);
//         } catch (error: any) {
//             message.error(error?.response?.data?.message || 'Không tải được booking');
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchData();
//     }, [bookingStatus, paymentStatus]);


//     return (
//         <div>
//             <Title level={2}>Booking của tôi</Title>

//             <Space wrap style={{ marginBottom: 16 }}>
//                 <Select
//                     allowClear
//                     placeholder="Booking status"
//                     style={{ width: 180 }}
//                     value={bookingStatus}
//                     onChange={(value) => setBookingStatus(value)}
//                 >
//                     <Option value="pending_payment">pending_payment</Option>
//                     <Option value="confirmed">confirmed</Option>
//                     <Option value="expired">expired</Option>
//                     <Option value="cancelled">cancelled</Option>
//                 </Select>

//                 <Select
//                     allowClear
//                     placeholder="Payment status"
//                     style={{ width: 180 }}
//                     value={paymentStatus}
//                     onChange={(value) => setPaymentStatus(value)}
//                 >
//                     <Option value="unpaid">unpaid</Option>
//                     <Option value="paid">paid</Option>
//                     <Option value="expired">expired</Option>
//                     <Option value="cancelled">cancelled</Option>
//                 </Select>
//             </Space>

//             {!loading && items.length === 0 ? (
//                 <Empty description="Bạn chưa có booking nào" />
//             ) : (
//                 <Row gutter={[16, 16]}>
//                     {items.map((booking) => (
//                         <Col xs={24} md={12} lg={8} key={booking.id}>
//                             <Card
//                                 title={booking.code}
//                                 extra={
//                                     <Button
//                                         type="link"
//                                         onClick={() =>
//                                             navigate(`/profile/bookings/${booking.id}`)
//                                         }
//                                     >
//                                         Chi tiết
//                                     </Button>
//                                 }
//                             >
//                                 <Space direction="vertical" size={8} style={{ width: '100%' }}>
//                                     <Text strong>
//                                         {booking.tour?.name ||
//                                             booking.tour?.title ||
//                                             `Tour #${booking.tourId}`}
//                                     </Text>

//                                     <Text>
//                                         Tổng tiền: <strong>{formatMoney(booking.totalAmount)} đ</strong>
//                                     </Text>

//                                     <Text>
//                                         Số lượng: {booking.adultCount} người lớn / {booking.childCount} trẻ em
//                                     </Text>

//                                     <Space wrap>
//                                         <Tag>{booking.bookingStatus}</Tag>
//                                         <Tag>{booking.paymentStatus}</Tag>
//                                     </Space>

//                                     <Text type="secondary">
//                                         Tạo lúc: {new Date(booking.createdAt).toLocaleString('vi-VN')}
//                                     </Text>
//                                 </Space>
//                             </Card>
//                         </Col>
//                     ))}
//                 </Row>
//             )}
//         </div>
//     );
// };

// export default MyBookingsPage;
import { useEffect, useState } from 'react';
import {
    Button,
    Card,
    Col,
    Empty,
    Row,
    Select,
    Space,
    Tag,
    Typography,
    message,
    Skeleton,
    Badge,
    Statistic,
    Avatar,
    Pagination,
} from 'antd';
import {
    CalendarOutlined,
    UserOutlined,
    DollarOutlined,
    FileTextOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined,
    EyeOutlined,
    TeamOutlined,
    RocketOutlined,
    FilterOutlined,
    ShoppingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import bookingService from '../../services/public/bookingService';
import { Booking, BookingStatus, MyBookingQueryParams, PaymentStatus } from '../../types/booking';
import './MyBookingsPage.scss';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const formatMoney = (value?: string | number) =>
    Number(value || 0).toLocaleString('vi-VN');



// Status configurations
const BOOKING_STATUS_CONFIG: Record<BookingStatus, {
    color: string;
    icon: any;
    text: string;
    bgColor: string;
    gradient: string;
}> = {
    pending_payment: {
        color: '#faad14',
        icon: <ClockCircleOutlined />,
        text: 'Chờ thanh toán',
        bgColor: '#fff7e6',
        gradient: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)',
    },
    confirmed: {
        color: '#52c41a',
        icon: <CheckCircleOutlined />,
        text: 'Đã xác nhận',
        bgColor: '#f6ffed',
        gradient: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
    },
    expired: {
        color: '#8c8c8c',
        icon: <CloseCircleOutlined />,
        text: 'Đã hết hạn',
        bgColor: '#fafafa',
        gradient: 'linear-gradient(135deg, #fafafa 0%, #e8e8e8 100%)',
    },
    cancelled: {
        color: '#ff4d4f',
        icon: <CloseCircleOutlined />,
        text: 'Đã hủy',
        bgColor: '#fff1f0',
        gradient: 'linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)',
    },
};

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, {
    color: string;
    icon: any;
    text: string
}> = {
    unpaid: {
        color: '#fa8c16',
        icon: <ExclamationCircleOutlined />,
        text: 'Chưa thanh toán',
    },
    paid: {
        color: '#52c41a',
        icon: <CheckCircleOutlined />,
        text: 'Đã thanh toán',
    },
    expired: {
        color: '#8c8c8c',
        icon: <CloseCircleOutlined />,
        text: 'Hết hạn',
    },
    cancelled: {
        color: '#ff4d4f',
        icon: <CloseCircleOutlined />,
        text: 'Đã hủy',
    },
};

const MyBookingsPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<Booking[]>([]);
    const [bookingStatus, setBookingStatus] = useState<BookingStatus | undefined>();
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | undefined>();
    const [page, setPage] = useState(1);
    const pageSize = 6;
    const [total, setTotal] = useState(0);

    const fetchData = async () => {
        try {
            setLoading(true);

            const params: MyBookingQueryParams = {
                page,
                limit: pageSize,
            };

            if (bookingStatus) {
                params.bookingStatus = bookingStatus;
            }

            if (paymentStatus) {
                params.paymentStatus = paymentStatus;
            }

            const response = await bookingService.getMyBookings(params);
            setItems(response.items || []);
            setTotal(response.pagination?.total || 0);
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Không tải được booking');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page, bookingStatus, paymentStatus]);

    // Calculate statistics
    const stats = {
        total: items.length,
        confirmed: items.filter(b => b.bookingStatus === 'confirmed').length,
        pending: items.filter(b => b.bookingStatus === 'pending_payment').length,
        totalAmount: items.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0),
    };

    // Render loading skeleton
    const renderSkeleton = () => (
        <Row gutter={[24, 24]}>
            {[1, 2, 3, 4, 5, 6].map((key) => (
                <Col xs={24} sm={12} lg={8} xl={6} key={key}>
                    <Card className="booking-card-skeleton">
                        <Skeleton active avatar paragraph={{ rows: 4 }} />
                    </Card>
                </Col>
            ))}
        </Row>
    );

    // Render booking card
    const renderBookingCard = (booking: Booking, index: number) => {
        const bookingStatusConfig = BOOKING_STATUS_CONFIG[booking.bookingStatus] || BOOKING_STATUS_CONFIG.pending_payment;
        const paymentStatusConfig = PAYMENT_STATUS_CONFIG[booking.paymentStatus] || PAYMENT_STATUS_CONFIG.unpaid;

        return (
            <Col xs={24} sm={24} md={12} lg={8} xl={8} xxl={6} key={booking.id}>
                <div
                    className="booking-card-wrapper"
                    style={{ animationDelay: `${index * 0.1}s` }}
                >
                    <Card
                        className={`booking-card booking-card--${booking.bookingStatus}`}
                        bordered={false}
                    >
                        {/* Status ribbon */}
                        <div
                            className="booking-card__ribbon"
                            style={{ background: bookingStatusConfig.color }}
                        >
                            {bookingStatusConfig.icon}
                            <span>{bookingStatusConfig.text}</span>
                        </div>

                        {/* Header */}
                        <div className="booking-card__header">
                            <div className="booking-card__icon">
                                <Avatar
                                    size={56}
                                    icon={<ShoppingOutlined />}
                                    style={{
                                        background: bookingStatusConfig.gradient,
                                        color: bookingStatusConfig.color,
                                    }}
                                />
                            </div>
                            <div className="booking-card__code">
                                <Text type="secondary" className="booking-card__code-label">
                                    Mã đặt tour
                                </Text>
                                <Text strong className="booking-card__code-value">
                                    #{booking.code}
                                </Text>
                            </div>
                        </div>

                        {/* Tour name */}
                        <div className="booking-card__tour">
                            <Paragraph
                                className="booking-card__tour-name"
                                ellipsis={{ rows: 2, tooltip: true }}
                            >
                                {booking.tour?.name ||
                                    booking.tour?.title ||
                                    `Tour #${booking.tourId}`}
                            </Paragraph>
                        </div>

                        {/* Info grid */}
                        <div className="booking-card__info">
                            <div className="booking-card__info-item">
                                <div className="booking-card__info-icon">
                                    <DollarOutlined />
                                </div>
                                <div className="booking-card__info-content">
                                    <Text type="secondary" className="booking-card__info-label">
                                        Tổng tiền
                                    </Text>
                                    <Text strong className="booking-card__info-value booking-card__info-value--price">
                                        {formatMoney(booking.totalAmount)}đ
                                    </Text>
                                </div>
                            </div>

                            <div className="booking-card__info-item">
                                <div className="booking-card__info-icon">
                                    <TeamOutlined />
                                </div>
                                <div className="booking-card__info-content">
                                    <Text type="secondary" className="booking-card__info-label">
                                        Số người
                                    </Text>
                                    <Text strong className="booking-card__info-value">
                                        {booking.adultCount + booking.childCount} người
                                    </Text>
                                </div>
                            </div>

                            <div className="booking-card__info-item booking-card__info-item--full">
                                <div className="booking-card__info-icon">
                                    <CalendarOutlined />
                                </div>
                                <div className="booking-card__info-content">
                                    <Text type="secondary" className="booking-card__info-label">
                                        Ngày đặt
                                    </Text>
                                    <Text className="booking-card__info-value">
                                        {new Date(booking.createdAt).toLocaleDateString('vi-VN', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </Text>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="booking-card__footer">
                            <Tag
                                icon={paymentStatusConfig.icon}
                                color={paymentStatusConfig.color}
                                className="booking-card__tag"
                            >
                                {paymentStatusConfig.text}
                            </Tag>

                            <Button
                                type="primary"
                                icon={<EyeOutlined />}
                                onClick={() => navigate(`/profile/bookings/${booking.id}`)}
                                className="booking-card__action"
                            >
                                Chi tiết
                            </Button>
                        </div>
                    </Card>
                </div>
            </Col>
        );
    };

    return (
        <div className="my-bookings-page">
            {/* Hero Header */}
            <div className="page-hero">
                <div className="page-hero__content">
                    <div className="page-hero__text">
                        <Title level={1} className="page-hero__title">
                            <RocketOutlined className="page-hero__icon" />
                            Booking của tôi
                        </Title>
                        <Paragraph className="page-hero__description">
                            Quản lý và theo dõi tất cả các đơn đặt tour của bạn
                        </Paragraph>
                    </div>

                    {/* Quick stats */}
                    {!loading && items.length > 0 && (
                        <div className="page-hero__stats">
                            <div className="stat-card stat-card--primary">
                                <Statistic
                                    title="Tổng booking"
                                    value={total}
                                    prefix={<FileTextOutlined />}
                                />
                            </div>
                            <div className="stat-card stat-card--success">
                                <Statistic
                                    title="Đã xác nhận"
                                    value={stats.confirmed}
                                    prefix={<CheckCircleOutlined />}
                                />
                            </div>
                            <div className="stat-card stat-card--warning">
                                <Statistic
                                    title="Chờ thanh toán"
                                    value={stats.pending}
                                    prefix={<ClockCircleOutlined />}
                                />
                            </div>
                            <div className="stat-card stat-card--info">
                                <Statistic
                                    title="Tổng chi tiêu"
                                    value={formatMoney(stats.totalAmount)}
                                    suffix="đ"
                                    prefix={<DollarOutlined />}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Filters */}
            <Card className="filter-section" bordered={false}>
                <div className="filter-section__header">
                    <div className="filter-section__title">
                        <FilterOutlined />
                        <Text strong>Bộ lọc</Text>
                    </div>
                </div>

                <div className="filter-section__content">
                    <div className="filter-group">
                        <label className="filter-label">Trạng thái booking</label>
                        <Select
                            allowClear
                            placeholder="Tất cả trạng thái"
                            className="filter-select"
                            value={bookingStatus}
                            onChange={(value) => {
                                setBookingStatus(value);
                                setPage(1);
                            }}
                            suffixIcon={<ClockCircleOutlined />}
                        >
                            <Option value="pending_payment">
                                <Space>
                                    <ClockCircleOutlined style={{ color: '#faad14' }} />
                                    Chờ thanh toán
                                </Space>
                            </Option>
                            <Option value="confirmed">
                                <Space>
                                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                    Đã xác nhận
                                </Space>
                            </Option>
                            <Option value="expired">
                                <Space>
                                    <CloseCircleOutlined style={{ color: '#8c8c8c' }} />
                                    Đã hết hạn
                                </Space>
                            </Option>
                            <Option value="cancelled">
                                <Space>
                                    <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                                    Đã hủy
                                </Space>
                            </Option>
                        </Select>
                    </div>

                    <div className="filter-group">
                        <label className="filter-label">Trạng thái thanh toán</label>
                        <Select
                            allowClear
                            placeholder="Tất cả trạng thái"
                            className="filter-select"
                            value={paymentStatus}
                            onChange={(value) => {
                                setPaymentStatus(value);
                                setPage(1);
                            }}
                            suffixIcon={<DollarOutlined />}
                        >
                            <Option value="unpaid">
                                <Space>
                                    <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />
                                    Chưa thanh toán
                                </Space>
                            </Option>
                            <Option value="paid">
                                <Space>
                                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                    Đã thanh toán
                                </Space>
                            </Option>
                            <Option value="expired">
                                <Space>
                                    <CloseCircleOutlined style={{ color: '#8c8c8c' }} />
                                    Hết hạn
                                </Space>
                            </Option>
                            <Option value="cancelled">
                                <Space>
                                    <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                                    Đã hủy
                                </Space>
                            </Option>
                        </Select>
                    </div>
                </div>
            </Card>

            {/* Content */}
            <div className="bookings-content">
                {loading ? (
                    renderSkeleton()
                ) : items.length === 0 ? (
                    <Card bordered={false} className="empty-state">
                        <Empty
                            image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                            imageStyle={{ height: 200 }}
                            description={
                                <Space direction="vertical" size={16}>
                                    <Title level={3} style={{ margin: 0 }}>
                                        Chưa có booking nào
                                    </Title>
                                    <Paragraph type="secondary" style={{ fontSize: 16 }}>
                                        Hãy khám phá và đặt tour du lịch yêu thích của bạn
                                    </Paragraph>
                                </Space>
                            }
                        >
                            <Button
                                type="primary"
                                size="large"
                                icon={<RocketOutlined />}
                                onClick={() => navigate('/tours')}
                            >
                                Khám phá tour ngay
                            </Button>
                        </Empty>
                    </Card>
                ) : (
                    <>
                        <div className="bookings-header">
                            <Text className="bookings-count">
                                Hiển thị <strong>{items.length}</strong>/<strong>{total}</strong> booking
                            </Text>
                        </div>
                        <>
                            <Row gutter={[24, 24]}>
                                {items.map((booking, index) => renderBookingCard(booking, index))}
                            </Row>
                            {total > pageSize && (
                                <div className="bookings-pagination">
                                    <Pagination
                                        current={page}
                                        pageSize={pageSize}
                                        total={total}
                                        onChange={(newPage) => setPage(newPage)}
                                        showSizeChanger={false}
                                    />
                                </div>
                            )}
                        </>
                    </>
                )}
            </div>
        </div>
    );
};

export default MyBookingsPage;