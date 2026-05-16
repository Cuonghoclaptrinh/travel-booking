import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useNavigate, useParams } from 'react-router-dom';
import adminTourBookingService, {
    AdminDepartureBookingItem,
    AdminTourDepartureItem,
} from '../../../services/admin/adminTourBookingService';
import bookingService from '../../../services/public/bookingService';
import { socket } from '../../../socket';

const formatMoney = (value?: string | number | null) => {
    if (value === undefined || value === null || value === '') return '0 đ';

    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) return '0 đ';

    return `${numberValue.toLocaleString('vi-VN')} đ`;
};

const formatDateTime = (value?: string) => {
    if (!value) return '—';
    return new Date(value).toLocaleString('vi-VN');
};

const formatDate = (value?: string) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('vi-VN');
};

const getPaymentStatusLabel = (status?: string | null) => {
    switch (status) {
        case 'paid':
            return 'Đã thanh toán';
        case 'unpaid':
            return 'Chưa thanh toán';
        case 'expired':
            return 'Hết hạn';
        case 'cancelled':
            return 'Đã huỷ';
        default:
            return status || '—';
    }
};

const getBookingStatusLabel = (status?: string | null) => {
    switch (status) {
        case 'confirmed':
            return 'Đã xác nhận';
        case 'pending_payment':
            return 'Chờ thanh toán';
        case 'expired':
            return 'Hết hạn';
        case 'cancelled':
            return 'Đã huỷ';
        default:
            return status || '—';
    }
};

const getBookingTotalAmount = (booking: any) => {
    if (!booking) return 0;

    const adultCount = Number(booking.adultCount || 0);
    const childCount = Number(booking.childCount || 0);
    const unitPriceAdult = Number(booking.unitPriceAdult || 0);
    const unitPriceChild = Number(booking.unitPriceChild || 0);

    return adultCount * unitPriceAdult + childCount * unitPriceChild;
};

type MuiChipColor =
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning';

const getPaymentStatusColor = (status?: string): MuiChipColor => {
    switch (status) {
        case 'paid':
        case 'success':
            return 'success';

        case 'unpaid':
        case 'pending':
            return 'warning';

        case 'failed':
        case 'cancelled':
        case 'expired':
            return 'error';

        case 'refunded':
            return 'info';

        default:
            return 'default';
    }
};

const getBookingStatusColor = (status?: string): MuiChipColor => {
    switch (status) {
        case 'confirmed':
            return 'success';

        case 'pending_payment':
        case 'pending':
            return 'warning';

        case 'cancelled':
        case 'expired':
            return 'error';

        default:
            return 'default';
    }
};

export default function TourBookingDetailPage() {
    const { tourId } = useParams();
    const navigate = useNavigate();

    const [tourInfo, setTourInfo] = useState<{
        id: number;
        name: string;
        slug: string;
        coverImageUrl?: string;
        destinationId?: number | null;
    } | null>(null);

    const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
    const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const [departures, setDepartures] = useState<AdminTourDepartureItem[]>([]);
    const [selectedDepartureId, setSelectedDepartureId] = useState<number | null>(null);

    const [departureBookings, setDepartureBookings] = useState<AdminDepartureBookingItem[]>([]);
    const [departureInfo, setDepartureInfo] = useState<{
        id: number;
        tourId: number;
        code: string;
        departureDate: string;
        returnDate: string;
        registrationDeadline?: string;
        capacity: number;
        bookedSlots: number;
        status: string;
        basePriceAdjustment?: string;
    } | null>(null);

    const [loadingDepartures, setLoadingDepartures] = useState(false);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [error, setError] = useState('');

    const handleOpenBookingDialog = (booking: any) => {
        setSelectedBooking(booking);
        setBookingDialogOpen(true);
    };

    const handleCloseBookingDialog = () => {
        if (actionLoading) return;

        setBookingDialogOpen(false);
        setSelectedBooking(null);
    };

    const fetchDepartures = async () => {
        if (!tourId) return;

        try {
            setLoadingDepartures(true);
            setError('');

            const response = await adminTourBookingService.getTourDepartures(Number(tourId));
            setTourInfo(response.tour);
            setDepartures(response.items);
            console.log("Departures", response.items)

            const firstDeparture = response.items[0];

            if (firstDeparture) {
                setSelectedDepartureId(firstDeparture.departureId);
            } else {
                setSelectedDepartureId(null);
                setDepartureBookings([]);
                setDepartureInfo(null);
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Không tải được danh sách đợt khởi hành');
        } finally {
            setLoadingDepartures(false);
        }
    };

    const fetchDepartureBookings = async (departureId: number) => {
        try {
            setLoadingBookings(true);
            setError('');

            const response = await adminTourBookingService.getDepartureBookings(departureId);
            setDepartureInfo(response.departure);
            setDepartureBookings(response.items);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Không tải được danh sách booking theo đợt');
        } finally {
            setLoadingBookings(false);
        }
    };

    useEffect(() => {
        fetchDepartures();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tourId]);

    useEffect(() => {
        if (selectedDepartureId) {
            fetchDepartureBookings(selectedDepartureId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDepartureId]);

    useEffect(() => {
        if (!selectedDepartureId) return;

        // Join admin room + departure room
        socket.emit('join_admin_room');
        socket.emit('join_departure_room', { departureId: selectedDepartureId });

        // Khi có booking mới hoặc slots thay đổi → reload dữ liệu
        const handleBookingCreated = () => fetchDepartureBookings(selectedDepartureId);
        const handleSlotsUpdated = () => fetchDepartureBookings(selectedDepartureId);

        socket.on('booking.created', handleBookingCreated);
        socket.on('departure.slots_updated', handleSlotsUpdated);

        return () => {
            socket.off('booking.created', handleBookingCreated);
            socket.off('departure.slots_updated', handleSlotsUpdated);
        };
    }, [selectedDepartureId]);

    useEffect(() => {
        if (!tourId) return;

        // Join admin room
        socket.emit('join_admin_room');

        // Lắng nghe event booking mới hoặc slots update
        const handleBookingCreated = () => fetchDepartures();
        const handleSlotsUpdated = () => fetchDepartures();
        const handleBookingUpdated = () => fetchDepartures();
        const handlePaymentUpdated = (payload: any) => {
            console.log("ADMIN payment.updated", payload);

            fetchDepartures();

            if (selectedDepartureId) {
                fetchDepartureBookings(selectedDepartureId);
            }
        };

        socket.on('booking.created', handleBookingCreated);
        socket.on('departure.slots_updated', handleSlotsUpdated);
        socket.on('booking.updated', handleBookingUpdated);
        socket.on('payment.updated', handlePaymentUpdated);

        return () => {
            socket.off('booking.created', handleBookingCreated);
            socket.off('departure.slots_updated', handleSlotsUpdated);
            socket.off('booking.updated', handleBookingUpdated);
            socket.off('payment.updated', handlePaymentUpdated);
        };
    }, [tourId, selectedDepartureId]);

    const summary = useMemo(() => {
        const totalBookings = departures.reduce((sum, item) => sum + item.totalBookings, 0);
        const totalGuests = departures.reduce((sum, item) => sum + item.totalGuests, 0);
        const totalReservedSlots = departures.reduce((sum, item) => sum + item.totalReservedSlots, 0);
        const totalAvailableSlots = departures.reduce((sum, item) => sum + item.availableSlots, 0);

        return {
            totalBookings,
            totalGuests,
            totalReservedSlots,
            totalAvailableSlots,
        };
    }, [departures]);

    const bookingColumns: GridColDef[] = [
        {
            field: 'bookingCode',
            headerName: 'Mã booking',
            width: 150,
            renderCell: (params) => (
                <Box
                    sx={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <Typography fontWeight={700}>
                        {params.row.bookingCode}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'contactName',
            headerName: 'Khách hàng',
            flex: 1,
            minWidth: 200,
            renderCell: (params) => (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        gap: 0.25,
                        height: '100%',
                        lineHeight: 1.2,
                    }}>
                    <Typography fontWeight={700}>
                        {params.row.contactName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {params.row.contactPhone || params.row.contactEmail}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'guestCount',
            headerName: 'Số khách',
            width: 110,
            valueGetter: (_, row) =>
                Number(row.adultCount || 0) + Number(row.childCount || 0),
        },
        {
            field: 'totalAmount',
            headerName: 'Tổng tiền',
            width: 150,
            renderCell: (params) => (
                <Box
                    sx={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <Typography fontWeight={700} color="error.main">
                        {formatMoney(getBookingTotalAmount(params.row))}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'bookingStatus',
            headerName: 'Booking',
            width: 150,
            renderCell: (params) => (
                <Chip
                    size="small"
                    label={getBookingStatusLabel(params.row.bookingStatus)}
                    color={getBookingStatusColor(params.row.bookingStatus)}
                    variant="outlined"
                />
            ),
        },
        {
            field: 'paymentStatus',
            headerName: 'Thanh toán',
            width: 150,
            renderCell: (params) => (
                <Chip
                    size="small"
                    label={getPaymentStatusLabel(params.row.paymentStatus)}
                    color={getPaymentStatusColor(params.row.paymentStatus)}
                    variant="outlined"
                />
            ),
        },
        {
            field: 'createdAt',
            headerName: 'Ngày đặt',
            width: 140,
            renderCell: (params) => formatDate(params.row.createdAt),
        },
    ];


    const getSelectedBookingId = () => {
        if (!selectedBooking) return null;

        return selectedBooking.bookingId || selectedBooking.id;
    };

    const canConfirmPayment = (booking: any) => {
        return (
            booking.bookingStatus === 'pending_payment' &&
            (
                booking.paymentStatus === 'unpaid' ||
                booking.paymentStatus === 'pending'
            )
        );
    };

    const canCancelBooking = (booking: any) => {
        return ['pending_payment', 'confirmed', 'pending'].includes(
            booking.bookingStatus,
        );
    };

    const canExpireBooking = (booking: any) => {
        return (
            booking.bookingStatus === 'pending_payment' &&
            (
                booking.paymentStatus === 'unpaid' ||
                booking.paymentStatus === 'pending'
            )
        );
    };

    const refreshSelectedDepartureBookings = async () => {
        if (!selectedDepartureId) return;

        await fetchDepartureBookings(selectedDepartureId);
    };

    const handleExpireSelectedBooking = async () => {
        const bookingId = getSelectedBookingId();

        if (!bookingId) return;

        try {
            setActionLoading(true);

            await bookingService.expireByAdmin(bookingId);

            await refreshSelectedDepartureBookings();

            setBookingDialogOpen(false);
            setSelectedBooking(null);
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                'Chuyển booking sang hết hạn thất bại',
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelSelectedBooking = async () => {
        const bookingId = getSelectedBookingId();

        if (!bookingId) return;

        try {
            setActionLoading(true);

            await bookingService.cancelByAdmin(bookingId, {
                reason: 'Admin hủy booking từ trang chi tiết tour',
            } as any);

            await refreshSelectedDepartureBookings();
            if (selectedDepartureId !== null) {
                await fetchDepartureBookings(selectedDepartureId);
            }
            await fetchDepartures();

            setBookingDialogOpen(false);
            setSelectedBooking(null);
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                'Hủy booking thất bại',
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleConfirmSelectedBookingPayment = async () => {
        const bookingId = getSelectedBookingId();

        if (!bookingId) return;

        try {
            setActionLoading(true);

            await bookingService.confirmPaymentByAdmin(bookingId, {
                paymentMethod: selectedBooking?.paymentMethod || 'cash',
                paymentReference:
                    selectedBooking?.paymentReference ||
                    `ADMIN-${bookingId}-${Date.now()}`,
            } as any);

            await refreshSelectedDepartureBookings();

            setBookingDialogOpen(false);
            setSelectedBooking(null);
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                'Xác nhận thanh toán thất bại',
            );
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <Stack spacing={3}>
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                spacing={2}
            >
                <Box>
                    <Typography variant="h4" fontWeight={800}>
                        Quản lý booking theo tour
                    </Typography>
                    <Typography color="text.secondary">
                        Theo dõi đợt khởi hành và danh sách khách đã đặt.
                    </Typography>
                </Box>

                <Button
                    variant="outlined"
                    onClick={() => navigate('/admin/bookings/tour-overview')}
                >
                    Quay lại tổng quan
                </Button>
            </Stack>

            {error && <Alert severity="error">{error}</Alert>}

            {tourInfo && (
                <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                            variant="rounded"
                            src={tourInfo.coverImageUrl || undefined}
                            sx={{ width: 72, height: 72, borderRadius: 2 }}
                        >
                            {tourInfo.name.charAt(0)}
                        </Avatar>

                        <Box>
                            <Typography variant="h6" fontWeight={800}>
                                {tourInfo.name}
                            </Typography>
                            <Typography color="text.secondary">
                                {tourInfo.slug}
                            </Typography>
                        </Box>
                    </Stack>
                </Paper>

            )}

            <Dialog
                open={bookingDialogOpen}
                onClose={handleCloseBookingDialog}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                            <Typography variant="h6" fontWeight={800}>
                                Chi tiết booking {selectedBooking?.bookingCode || selectedBooking?.code || ''}
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                                Thông tin chi tiết và thao tác xử lý booking
                            </Typography>
                        </Box>

                        <IconButton onClick={handleCloseBookingDialog} disabled={actionLoading}>
                            Đóng
                        </IconButton>
                    </Stack>
                </DialogTitle>

                <DialogContent dividers>
                    {selectedBooking ? (
                        <Stack spacing={3}>
                            <Box>
                                <Typography fontWeight={800} gutterBottom>
                                    Thông tin khách hàng
                                </Typography>

                                <InfoRow label="Họ tên" value={selectedBooking.contactName} />
                                <InfoRow label="Email" value={selectedBooking.contactEmail} />
                                <InfoRow label="Số điện thoại" value={selectedBooking.contactPhone} />
                            </Box>

                            <Divider />

                            <Box>
                                <Typography fontWeight={800} gutterBottom>
                                    Thông tin chuyến đi
                                </Typography>

                                <InfoRow label="Mã booking" value={selectedBooking.bookingCode || selectedBooking.code} />
                                <InfoRow label="Mã đợt" value={departureInfo?.code} />
                                <InfoRow
                                    label="Ngày đi"
                                    value={departureInfo?.departureDate ? formatDate(departureInfo.departureDate) : '-'}
                                />
                                <InfoRow
                                    label="Ngày về"
                                    value={departureInfo?.returnDate ? formatDate(departureInfo.returnDate) : '-'}
                                />
                                <InfoRow label="Gói tour" value={selectedBooking.packageName} />
                                <InfoRow label="Điểm đi" value={selectedBooking.departureCity} />
                                <InfoRow label="Phương tiện" value={selectedBooking.transportType} />
                            </Box>

                            <Divider />

                            <Box>
                                <Typography fontWeight={800} gutterBottom>
                                    Số lượng khách
                                </Typography>

                                <InfoRow label="Người lớn" value={selectedBooking.adultCount} />
                                <InfoRow label="Trẻ em" value={selectedBooking.childCount} />
                                <InfoRow label="Tổng giữ chỗ" value={selectedBooking.reservedSlots} />
                                <InfoRow
                                    label="HDV riêng"
                                    value={selectedBooking.isPrivateGuide ? 'Có' : 'Không'}
                                />
                            </Box>

                            <Divider />

                            <Box>
                                <Typography fontWeight={800} gutterBottom>
                                    Thanh toán
                                </Typography>

                                <InfoRow
                                    label="Tổng tiền"
                                    value={formatMoney(getBookingTotalAmount(selectedBooking))}
                                />
                                <InfoRow
                                    label="Trạng thái booking"
                                    value={
                                        <Chip
                                            size="small"
                                            label={getBookingStatusLabel(selectedBooking.bookingStatus)}
                                            color={getBookingStatusColor(selectedBooking.bookingStatus)}
                                            variant="outlined"
                                        />
                                    }
                                />
                                <InfoRow
                                    label="Trạng thái thanh toán"
                                    value={
                                        <Chip
                                            size="small"
                                            label={getPaymentStatusLabel(selectedBooking.paymentStatus)}
                                            color={getPaymentStatusColor(selectedBooking.paymentStatus)}
                                            variant="outlined"
                                        />
                                    }
                                />
                                <InfoRow label="Phương thức" value={selectedBooking.paymentMethod} />
                                <InfoRow label="Mã tham chiếu" value={selectedBooking.paymentReference} />
                                <InfoRow
                                    label="Ngày thanh toán"
                                    value={
                                        selectedBooking.paidAt
                                            ? formatDateTime(selectedBooking.paidAt)
                                            : '-'
                                    }
                                />
                            </Box>

                            {selectedBooking.note && (
                                <>
                                    <Divider />

                                    <Box>
                                        <Typography fontWeight={800} gutterBottom>
                                            Ghi chú
                                        </Typography>

                                        <Typography color="text.secondary">
                                            {selectedBooking.note}
                                        </Typography>
                                    </Box>
                                </>
                            )}
                        </Stack>
                    ) : (
                        <Typography color="text.secondary">
                            Chưa chọn booking.
                        </Typography>
                    )}
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={handleCloseBookingDialog} disabled={actionLoading}>
                        Đóng
                    </Button>

                    {selectedBooking && canExpireBooking(selectedBooking) && (
                        <Button
                            variant="outlined"
                            color="warning"
                            disabled={actionLoading}
                            onClick={() => handleExpireSelectedBooking()}
                        >
                            Chuyển hết hạn
                        </Button>
                    )}

                    {selectedBooking && canCancelBooking(selectedBooking) && (
                        <Button
                            variant="outlined"
                            color="error"
                            disabled={actionLoading}
                            onClick={() => handleCancelSelectedBooking()}
                        >
                            Hủy booking
                        </Button>
                    )}

                    {selectedBooking && canConfirmPayment(selectedBooking) && (
                        <Button
                            variant="contained"
                            disabled={actionLoading}
                            onClick={() => handleConfirmSelectedBookingPayment()}
                        >
                            Xác nhận thanh toán
                        </Button>
                    )}
                </DialogActions>
            </Dialog>


            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                                Tổng booking
                            </Typography>
                            <Typography variant="h5" fontWeight={800}>
                                {summary.totalBookings}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                                Tổng khách
                            </Typography>
                            <Typography variant="h5" fontWeight={800}>
                                {summary.totalGuests}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                                Tổng chỗ đã giữ
                            </Typography>
                            <Typography variant="h5" fontWeight={800}>
                                {summary.totalReservedSlots}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                                Chỗ còn lại
                            </Typography>
                            <Typography variant="h5" fontWeight={800}>
                                {summary.totalAvailableSlots}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Grid container spacing={3} alignItems="flex-start">
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 2, borderRadius: 3 }}>
                        <Stack spacing={2}>
                            <Typography variant="h6" fontWeight={800}>
                                Danh sách đợt khởi hành
                            </Typography>

                            {loadingDepartures ? (
                                <Box display="flex" justifyContent="center" py={4}>
                                    <CircularProgress />
                                </Box>
                            ) : departures.length === 0 ? (
                                <Alert severity="info">Tour này chưa có đợt khởi hành nào.</Alert>
                            ) : (
                                departures.map((item) => {
                                    const selected = item.departureId === selectedDepartureId;

                                    return (
                                        <Paper
                                            key={item.departureId}
                                            variant="outlined"
                                            onClick={() => setSelectedDepartureId(item.departureId)}
                                            sx={{
                                                p: 2,
                                                borderRadius: 2,
                                                cursor: 'pointer',
                                                borderColor: selected ? 'primary.main' : 'divider',
                                                bgcolor: selected ? 'action.hover' : 'background.paper',
                                            }}
                                        >
                                            <Stack spacing={1}>
                                                <Stack
                                                    direction="row"
                                                    justifyContent="space-between"
                                                    alignItems="center"
                                                >
                                                    <Typography fontWeight={700}>
                                                        {item.code}
                                                    </Typography>

                                                    <Chip
                                                        size="small"
                                                        color={item.status === 'open' ? 'success' : 'default'}
                                                        label={item.status}
                                                    />
                                                </Stack>

                                                <Typography variant="body2" color="text.secondary">
                                                    Khởi hành: {formatDate(item.departureDate)}
                                                </Typography>

                                                <Typography variant="body2" color="text.secondary">
                                                    Kết thúc: {formatDate(item.returnDate)}
                                                </Typography>

                                                <Divider />

                                                <Grid container spacing={1}>
                                                    <Grid size={6}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Capacity
                                                        </Typography>
                                                        <Typography fontWeight={700}>
                                                            {item.capacity}
                                                        </Typography>
                                                    </Grid>

                                                    <Grid size={6}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Đã giữ chỗ
                                                        </Typography>
                                                        <Typography fontWeight={700}>
                                                            {item.totalReservedSlots}
                                                        </Typography>
                                                    </Grid>

                                                    <Grid size={6}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Booking
                                                        </Typography>
                                                        <Typography fontWeight={700}>
                                                            {item.totalBookings}
                                                        </Typography>
                                                    </Grid>

                                                    <Grid size={6}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Còn lại
                                                        </Typography>
                                                        <Typography fontWeight={700}>
                                                            {item.availableSlots}
                                                        </Typography>
                                                    </Grid>
                                                </Grid>
                                            </Stack>
                                        </Paper>
                                    );
                                })
                            )}
                        </Stack>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 2, borderRadius: 3 }}>
                        <Stack spacing={2}>
                            <Box>
                                <Typography variant="h6" fontWeight={800}>
                                    Danh sách booking theo đợt
                                </Typography>

                                {departureInfo && (
                                    <Typography color="text.secondary">
                                        {departureInfo.code} • {formatDate(departureInfo.departureDate)} -{' '}
                                        {formatDate(departureInfo.returnDate)}
                                    </Typography>
                                )}
                            </Box>

                            {loadingBookings ? (
                                <Box display="flex" justifyContent="center" py={8}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <DataGrid
                                    rows={departureBookings}
                                    columns={bookingColumns}
                                    getRowId={(row) => row.bookingId}
                                    autoHeight
                                    disableRowSelectionOnClick
                                    pageSizeOptions={[10, 20, 50]}
                                    initialState={{
                                        pagination: {
                                            paginationModel: {
                                                page: 0,
                                                pageSize: 10,
                                            },
                                        },
                                    }}
                                    onRowClick={(params) => {
                                        console.log('departureBookings:', departureBookings);
                                        handleOpenBookingDialog(params.row);
                                    }}
                                    sx={{
                                        '& .MuiDataGrid-row': {
                                            cursor: 'pointer',
                                        },

                                        '& .MuiDataGrid-cell:focus': {
                                            outline: 'none',
                                        },

                                        '& .MuiDataGrid-cell:focus-within': {
                                            outline: 'none',
                                        },

                                        '& .MuiDataGrid-columnHeader:focus': {
                                            outline: 'none',
                                        },

                                        '& .MuiDataGrid-columnHeader:focus-within': {
                                            outline: 'none',
                                        },
                                    }}
                                />
                            )}
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>
        </Stack>
    );

    function InfoRow({
        label,
        value,
    }: {
        label: string;
        value?: React.ReactNode;
    }) {
        return (
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                spacing={1}
                py={0.75}
            >
                <Typography color="text.secondary">
                    {label}
                </Typography>

                <Box
                    sx={{
                        fontWeight: 700,
                        textAlign: {
                            xs: 'left',
                            sm: 'right',
                        },
                    }}
                >
                    {value || '-'}
                </Box>
            </Stack>
        );
    }
}