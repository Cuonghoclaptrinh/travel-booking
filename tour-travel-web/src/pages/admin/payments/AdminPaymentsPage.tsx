import { useEffect, useMemo, useState } from 'react';
import {
    Button,
    DatePicker,
    Input,
    Select,
    Space,
    Table,
    Tag,
    Typography,
    message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import paymentService from '../../../services/admin/paymentService';
import {
    AdminPaymentQueryParams,
    PaymentProvider,
    PaymentTransaction,
    PaymentTransactionStatus,
} from '../../../types/payment';

const { Title } = Typography;
const { Option } = Select;

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

const formatMoney = (value?: string | number, currency = 'VND') => {
    return `${Number(value || 0).toLocaleString('vi-VN')} ${currency}`;
};

const formatDateTime = (value?: string) => {
    if (!value) return '-';
    return new Date(value).toLocaleString('vi-VN');
};

const AdminPaymentsPage = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<PaymentTransaction[]>([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);

    const [filters, setFilters] = useState<AdminPaymentQueryParams>({
        page: 1,
        limit: 10,
    });

    const fetchData = async (params?: AdminPaymentQueryParams) => {
        try {
            setLoading(true);

            const query = params || filters;
            const response = await paymentService.getAdminPayments(query);

            setItems(response.items);
            setTotal(response.pagination.total);
            setPage(response.pagination.page);
            setLimit(response.pagination.limit);
        } catch (error: any) {
            message.error(
                error?.response?.data?.message ||
                'Không tải được danh sách thanh toán',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(filters);
    }, []);

    const buildCleanQuery = (
        source: AdminPaymentQueryParams,
        nextPage = 1,
        nextLimit = limit,
    ): AdminPaymentQueryParams => {
        const query: AdminPaymentQueryParams = {
            page: nextPage,
            limit: nextLimit,
        };

        if (source.transactionRef?.trim()) {
            query.transactionRef = source.transactionRef.trim();
        }

        if (source.providerTransactionId?.trim()) {
            query.providerTransactionId = source.providerTransactionId.trim();
        }

        if (source.bookingCode?.trim()) {
            query.bookingCode = source.bookingCode.trim();
        }

        if (source.bookingId) query.bookingId = source.bookingId;
        if (source.userId) query.userId = source.userId;
        if (source.tourId) query.tourId = source.tourId;
        if (source.provider) query.provider = source.provider;
        if (source.status) query.status = source.status;
        if (source.createdFrom) query.createdFrom = source.createdFrom;
        if (source.createdTo) query.createdTo = source.createdTo;
        if (source.paidFrom) query.paidFrom = source.paidFrom;
        if (source.paidTo) query.paidTo = source.paidTo;

        return query;
    };

    const handleSearch = () => {
        const query = buildCleanQuery(filters, 1, limit);
        setFilters(query);
        fetchData(query);
    };

    const handleReset = () => {
        const query: AdminPaymentQueryParams = {
            page: 1,
            limit: 10,
        };

        setFilters(query);
        setPage(1);
        setLimit(10);
        fetchData(query);
    };

    const handleTableChange = (nextPage: number, nextLimit: number) => {
        const query = buildCleanQuery(filters, nextPage, nextLimit);
        setFilters(query);
        fetchData(query);
    };

    const columns: ColumnsType<PaymentTransaction> = useMemo(
        () => [
            {
                title: 'Mã giao dịch',
                dataIndex: 'transactionRef',
                key: 'transactionRef',
                width: 230,
                fixed: 'left',
                ellipsis: true,
            },
            {
                title: 'Booking',
                key: 'booking',
                width: 160,
                render: (_, record) => record.booking?.code || `#${record.bookingId}`,
            },
            {
                title: 'Khách hàng',
                key: 'customer',
                width: 220,
                render: (_, record) => {
                    const booking = record.booking;

                    return (
                        <div>
                            <div>{booking?.contactName || '-'}</div>
                            <div style={{ color: '#888' }}>
                                {booking?.contactEmail || '-'}
                            </div>
                        </div>
                    );
                },
            },
            {
                title: 'Tour',
                key: 'tour',
                width: 240,
                render: (_, record) =>
                    record.booking?.tour?.name ||
                    record.booking?.tour?.title ||
                    `Tour #${record.booking?.tourId || '-'}`,
            },
            {
                title: 'Provider',
                dataIndex: 'provider',
                key: 'provider',
                width: 130,
                render: (provider: PaymentProvider) => (
                    <Tag color={providerColorMap[provider]}>{provider}</Tag>
                ),
            },
            {
                title: 'Trạng thái',
                dataIndex: 'status',
                key: 'status',
                width: 130,
                render: (status: PaymentTransactionStatus) => (
                    <Tag color={statusColorMap[status]}>{status}</Tag>
                ),
            },
            {
                title: 'Số tiền',
                key: 'amount',
                width: 150,
                render: (_, record) => formatMoney(record.amount, record.currency),
            },
            {
                title: 'Mã GD nhà cung cấp',
                dataIndex: 'providerTransactionId',
                key: 'providerTransactionId',
                width: 180,
                ellipsis: true,
                render: (value?: string) => value || '-',
            },
            {
                title: 'Ngày tạo',
                key: 'createdAt',
                width: 180,
                render: (_, record) => formatDateTime(record.createdAt),
            },
            {
                title: 'Ngày thanh toán',
                key: 'paidAt',
                width: 180,
                render: (_, record) => formatDateTime(record.paidAt),
            },
            {
                title: 'Thao tác',
                key: 'actions',
                fixed: 'right',
                width: 120,
                render: (_, record) => (
                    <Button
                        size="small"
                        type="link"
                        onClick={() => navigate(`/admin/payments/${record.id}`)}
                    >
                        Chi tiết
                    </Button>
                ),
            },
        ],
        [navigate],
    );

    return (
        <div>
            <Title level={3}>Quản lý thanh toán</Title>

            <Space wrap style={{ marginBottom: 16 }}>
                <Input
                    placeholder="Mã giao dịch"
                    style={{ width: 220 }}
                    value={filters.transactionRef}
                    onChange={(e) =>
                        setFilters((prev) => ({
                            ...prev,
                            transactionRef: e.target.value,
                        }))
                    }
                />

                <Input
                    placeholder="Mã booking"
                    style={{ width: 180 }}
                    value={filters.bookingCode}
                    onChange={(e) =>
                        setFilters((prev) => ({
                            ...prev,
                            bookingCode: e.target.value,
                        }))
                    }
                />

                <Input
                    placeholder="Mã GD nhà cung cấp"
                    style={{ width: 220 }}
                    value={filters.providerTransactionId}
                    onChange={(e) =>
                        setFilters((prev) => ({
                            ...prev,
                            providerTransactionId: e.target.value,
                        }))
                    }
                />

                <Select<PaymentProvider>
                    allowClear
                    placeholder="Provider"
                    style={{ width: 160 }}
                    value={filters.provider ?? null}
                    onChange={(value) =>
                        setFilters((prev) => {
                            const next = { ...prev };
                            if (value == null) delete next.provider;
                            else next.provider = value;
                            return next;
                        })
                    }
                >
                    <Option value="vnpay">VNPay</Option>
                    <Option value="momo">MoMo</Option>
                    <Option value="zalopay">ZaloPay</Option>
                    <Option value="bank_transfer">Bank transfer</Option>
                    <Option value="cash">Cash</Option>
                    <Option value="mock">Mock</Option>
                </Select>

                <Select<PaymentTransactionStatus>
                    allowClear
                    placeholder="Trạng thái"
                    style={{ width: 160 }}
                    value={filters.status ?? null}
                    onChange={(value) =>
                        setFilters((prev) => {
                            const next = { ...prev };
                            if (value == null) delete next.status;
                            else next.status = value;
                            return next;
                        })
                    }
                >
                    <Option value="pending">pending</Option>
                    <Option value="success">success</Option>
                    <Option value="failed">failed</Option>
                    <Option value="cancelled">cancelled</Option>
                    <Option value="expired">expired</Option>
                    <Option value="refunded">refunded</Option>
                </Select>

                <DatePicker
                    placeholder="Tạo từ ngày"
                    value={filters.createdFrom ? dayjs(filters.createdFrom) : null}
                    onChange={(date) =>
                        setFilters((prev) => {
                            const next = { ...prev };
                            if (!date) delete next.createdFrom;
                            else next.createdFrom = date.format('YYYY-MM-DD');
                            return next;
                        })
                    }
                />

                <DatePicker
                    placeholder="Tạo đến ngày"
                    value={filters.createdTo ? dayjs(filters.createdTo) : null}
                    onChange={(date) =>
                        setFilters((prev) => {
                            const next = { ...prev };
                            if (!date) delete next.createdTo;
                            else next.createdTo = date.format('YYYY-MM-DD');
                            return next;
                        })
                    }
                />

                <Button type="primary" onClick={handleSearch}>
                    Tìm kiếm
                </Button>

                <Button onClick={handleReset}>Làm mới</Button>
            </Space>

            <Table
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={items}
                scroll={{ x: 1800 }}
                pagination={{
                    current: page,
                    pageSize: limit,
                    total,
                    showSizeChanger: true,
                    pageSizeOptions: [10, 20, 50, 100],
                    onChange: handleTableChange,
                }}
            />
        </div>
    );
};

export default AdminPaymentsPage;