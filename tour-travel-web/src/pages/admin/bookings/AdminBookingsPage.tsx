import { useEffect, useMemo, useState } from 'react';
import {
    Button,
    Input,
    Modal,
    Select,
    Space,
    Table,
    Tag,
    Typography,
    message,
    Form,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import bookingService from '../../../services/public/bookingService';
import {
    AdminBookingQueryParams,
    AdminCancelBookingPayload,
    AdminConfirmPaymentPayload,
    Booking,
    BookingStatus,
    PaymentMethod,
    PaymentStatus,
} from '../../../types/booking';
import { useAdminSocket } from '../../../hooks/useAdminSocket';
import { socket } from '../../../socket';

const { Title } = Typography;
const { Option } = Select;

const bookingStatusColorMap: Record<BookingStatus, string> = {
    pending_payment: 'orange',
    confirmed: 'green',
    expired: 'red',
    cancelled: 'default',
};

const paymentStatusColorMap: Record<PaymentStatus, string> = {
    unpaid: 'orange',
    paid: 'green',
    expired: 'red',
    cancelled: 'default',
};

const formatMoney = (value?: string | number) =>
    Number(value || 0).toLocaleString('vi-VN');

const AdminBookingsPage = () => {
    // useAdminSocket(true);

    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<Booking[]>([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);

    const [filters, setFilters] = useState<AdminBookingQueryParams>({
        page: 1,
        limit: 10,
    });

    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [confirmPaymentOpen, setConfirmPaymentOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);

    const [confirmPaymentForm] = Form.useForm<AdminConfirmPaymentPayload>();
    const [cancelForm] = Form.useForm<AdminCancelBookingPayload>();

    const fetchData = async (params?: AdminBookingQueryParams) => {
        try {
            setLoading(true);
            const query = params || filters;
            const response = await bookingService.getAdminBookings(query);
            setItems(response.items);
            setTotal(response.pagination.total);
            setPage(response.pagination.page);
            setLimit(response.pagination.limit);
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Không tải được danh sách booking');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(filters);
    }, []);

    useEffect(() => {
        const onBookingCreated = (payload: any) => {
            console.log('booking.created', payload);

            // bước đầu: chỉ log
            // bước sau: refetch lại danh sách booking
        };

        socket.on('booking.created', onBookingCreated);

        return () => {
            socket.off('booking.created', onBookingCreated);
        };
    }, []);


    const handleSearch = () => {
        const next = { ...filters, page: 1, limit };
        setFilters(next);
        fetchData(next);
    };

    const handleTableChange = (nextPage: number, nextLimit: number) => {
        const next = { ...filters, page: nextPage, limit: nextLimit };
        setFilters(next);
        fetchData(next);
    };

    const handleOpenConfirmPayment = (booking: Booking) => {
        setSelectedBooking(booking);
        confirmPaymentForm.setFieldsValue({
            paymentMethod: 'mock_gateway',
            paymentReference: '',
            note: '',
        });
        setConfirmPaymentOpen(true);
    };

    const handleSubmitConfirmPayment = async () => {
        if (!selectedBooking) return;

        try {
            const values = await confirmPaymentForm.validateFields();
            await bookingService.confirmPaymentByAdmin(selectedBooking.id, values);
            message.success('Xác nhận thanh toán thành công');
            setConfirmPaymentOpen(false);
            setSelectedBooking(null);
            fetchData();
        } catch (error: any) {
            if (error?.errorFields) return;
            message.error(error?.response?.data?.message || 'Không thể xác nhận thanh toán');
        }
    };

    const handleOpenCancel = (booking: Booking) => {
        setSelectedBooking(booking);
        cancelForm.setFieldsValue({ reason: '' });
        setCancelOpen(true);
    };

    const handleSubmitCancel = async () => {
        if (!selectedBooking) return;

        try {
            const values = await cancelForm.validateFields();
            await bookingService.cancelByAdmin(selectedBooking.id, values);
            message.success('Huỷ booking thành công');
            setCancelOpen(false);
            setSelectedBooking(null);
            fetchData();
        } catch (error: any) {
            if (error?.errorFields) return;
            message.error(error?.response?.data?.message || 'Không thể huỷ booking');
        }
    };

    const handleExpire = async (booking: Booking) => {
        try {
            await bookingService.expireByAdmin(booking.id);
            message.success('Đã chuyển booking sang hết hạn');
            fetchData();
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Không thể expire booking');
        }
    };

    const columns: ColumnsType<Booking> = useMemo(
        () => [
            {
                title: 'Mã booking',
                dataIndex: 'code',
                key: 'code',
                width: 160,
                fixed: 'left',
            },
            {
                title: 'Khách hàng',
                key: 'customer',
                render: (_, record) => (
                    <div>
                        <div>{record.contactName}</div>
                        <div style={{ color: '#888' }}>{record.contactEmail}</div>
                    </div>
                ),
                width: 220,
            },
            {
                title: 'Tour',
                key: 'tour',
                render: (_, record) =>
                    record.tour?.name || record.tour?.title || `Tour #${record.tourId}`,
                width: 220,
            },
            {
                title: 'SL',
                key: 'slots',
                render: (_, record) => `${record.adultCount} NL / ${record.childCount} TE`,
                width: 120,
            },
            {
                title: 'Tổng tiền',
                key: 'totalAmount',
                render: (_, record) => `${formatMoney(record.totalAmount)} đ`,
                width: 140,
            },
            {
                title: 'Booking status',
                key: 'bookingStatus',
                render: (_, record) => (
                    <Tag color={bookingStatusColorMap[record.bookingStatus]}>
                        {record.bookingStatus}
                    </Tag>
                ),
                width: 150,
            },
            {
                title: 'Payment status',
                key: 'paymentStatus',
                render: (_, record) => (
                    <Tag color={paymentStatusColorMap[record.paymentStatus]}>
                        {record.paymentStatus}
                    </Tag>
                ),
                width: 150,
            },
            {
                title: 'Hết hạn',
                key: 'expiresAt',
                render: (_, record) =>
                    record.expiresAt ? new Date(record.expiresAt).toLocaleString('vi-VN') : '',
                width: 180,
            },
            {
                title: 'Thao tác',
                key: 'actions',
                fixed: 'right',
                width: 260,
                render: (_, record) => (
                    <Space wrap>
                        <Button size="small" onClick={() => handleOpenConfirmPayment(record)}>
                            Xác nhận TT
                        </Button>
                        <Button size="small" danger onClick={() => handleOpenCancel(record)}>
                            Huỷ
                        </Button>
                        <Button size="small" onClick={() => handleExpire(record)}>
                            Expire
                        </Button>
                    </Space>
                ),
            },
        ],
        [],
    );

    return (
        <div>
            <Title level={3}>Quản lý Bookings</Title>

            <Space wrap style={{ marginBottom: 16 }}>
                <Input
                    placeholder="Mã booking"
                    style={{ width: 180 }}
                    value={filters.code}
                    onChange={(e) =>
                        setFilters((prev) => ({ ...prev, code: e.target.value }))
                    }
                />

                <Input
                    placeholder="Email liên hệ"
                    style={{ width: 220 }}
                    value={filters.contactEmail}
                    onChange={(e) =>
                        setFilters((prev) => ({ ...prev, contactEmail: e.target.value }))
                    }
                />

                <Select
                    allowClear
                    placeholder="Booking status"
                    style={{ width: 180 }}
                    value={filters.bookingStatus ?? null}
                    onChange={(value) =>
                        setFilters((prev) => ({ ...prev, bookingStatus: value }))
                    }
                >
                    <Option value="pending_payment">pending_payment</Option>
                    <Option value="confirmed">confirmed</Option>
                    <Option value="expired">expired</Option>
                    <Option value="cancelled">cancelled</Option>
                </Select>

                <Select
                    allowClear
                    placeholder="Payment status"
                    style={{ width: 180 }}
                    value={filters.paymentStatus ?? null}
                    onChange={(value) =>
                        setFilters((prev) => ({ ...prev, paymentStatus: value }))
                    }
                >
                    <Option value="unpaid">unpaid</Option>
                    <Option value="paid">paid</Option>
                    <Option value="expired">expired</Option>
                    <Option value="cancelled">cancelled</Option>
                </Select>

                <Button type="primary" onClick={handleSearch}>
                    Tìm kiếm
                </Button>
            </Space>

            <Table
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={items}
                scroll={{ x: 1500 }}
                pagination={{
                    current: page,
                    pageSize: limit,
                    total,
                    onChange: handleTableChange,
                }}
            />

            <Modal
                title={`Xác nhận thanh toán ${selectedBooking?.code || ''}`}
                open={confirmPaymentOpen}
                onOk={handleSubmitConfirmPayment}
                onCancel={() => setConfirmPaymentOpen(false)}
                destroyOnHidden
            >
                <Form layout="vertical" form={confirmPaymentForm}>
                    <Form.Item
                        label="Phương thức thanh toán"
                        name="paymentMethod"
                        rules={[{ required: true, message: 'Chọn phương thức thanh toán' }]}
                    >
                        <Select>
                            <Option value="mock_gateway">mock_gateway</Option>
                            <Option value="bank_transfer">bank_transfer</Option>
                            <Option value="cash">cash</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item label="Mã tham chiếu" name="paymentReference">
                        <Input />
                    </Form.Item>

                    <Form.Item label="Ghi chú" name="note">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={`Huỷ booking ${selectedBooking?.code || ''}`}
                open={cancelOpen}
                onOk={handleSubmitCancel}
                onCancel={() => setCancelOpen(false)}
                destroyOnHidden
            >
                <Form layout="vertical" form={cancelForm}>
                    <Form.Item label="Lý do" name="reason">
                        <Input.TextArea rows={4} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AdminBookingsPage;