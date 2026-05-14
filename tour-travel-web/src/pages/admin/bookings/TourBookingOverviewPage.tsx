import { useEffect, useState } from 'react';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import adminTourBookingService, {
    AdminTourBookingOverviewItem,
} from '../../../services/admin/adminTourBookingService';

const formatMoney = (value?: string | number | null) => {
    if (value === undefined || value === null || value === '') {
        return '0 đ';
    }

    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) {
        return '0 đ';
    }

    return `${numberValue.toLocaleString('vi-VN')} đ`;
};

export default function TourBookingOverviewPage() {
    const navigate = useNavigate();

    const [items, setItems] = useState<AdminTourBookingOverviewItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    const [meta, setMeta] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
    });

    const fetchData = async (params?: { page?: number; limit?: number; search?: string }) => {
        try {
            setLoading(true);
            setError('');

            const queryParams: { page?: number; limit?: number; search?: string } = {
                page: params?.page ?? meta.page,
                limit: params?.limit ?? meta.limit,
            };

            if (params?.search && params.search.trim()) {
                queryParams.search = params.search.trim();
            }

            const response = await adminTourBookingService.getTourOverview(queryParams);

            setItems(response.items);
            setMeta(response.meta);
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                'Không tải được dữ liệu tổng quan booking theo tour',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData({ page: 1, limit: 10 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = () => {
        const keyword = search.trim();

        fetchData({
            page: 1,
            limit: meta.limit,
            ...(keyword ? { search: keyword } : {}),
        });
    };

    const handleReset = () => {
        setSearch('');
        fetchData({
            page: 1,
            limit: meta.limit,
        });
    };

    const columns: GridColDef[] = [
        {
            field: 'coverImage',
            headerName: 'Ảnh',
            width: 90,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <Avatar
                    variant="rounded"
                    src={params.row.coverImageUrl || undefined}
                    sx={{ width: 56, height: 56, borderRadius: 2 }}
                >
                    {params.row.tourName?.charAt(0)}
                </Avatar>
            ),
        },
        {
            field: 'tourName',
            headerName: 'Tên tour',
            minWidth: 260,
            flex: 1,
            renderCell: (params) => (
                <Box sx={{ py: 1 }}>
                    <Typography fontWeight={700}>{params.row.tourName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {params.row.tourSlug}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'departureCount',
            headerName: 'Số đợt',
            width: 100,
        },
        {
            field: 'openDepartureCount',
            headerName: 'Đợt mở',
            width: 110,
            renderCell: (params) => (
                <Chip
                    size="small"
                    color="success"
                    variant="outlined"
                    label={params.row.openDepartureCount}
                />
            ),
        },
        {
            field: 'totalBookings',
            headerName: 'Booking',
            width: 100,
        },
        {
            field: 'totalGuests',
            headerName: 'Tổng khách',
            width: 110,
        },
        {
            field: 'totalPaidBookings',
            headerName: 'Đã thanh toán',
            width: 130,
            renderCell: (params) => (
                <Chip
                    size="small"
                    color="primary"
                    variant="outlined"
                    label={params.row.totalPaidBookings}
                />
            ),
        },
        {
            field: 'totalPaidAmount',
            headerName: 'Tổng tiền',
            minWidth: 160,
            renderCell: (params) => (
                <Typography fontWeight={700} color="error.main">
                    {formatMoney(params.row.totalPaidAmount)}
                </Typography>
            ),
        },
        {
            field: 'actions',
            headerName: 'Hành động',
            width: 150,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <Button
                    variant="contained"
                    size="small"
                    onClick={() =>
                        navigate(`/admin/bookings/tours/${params.row.tourId}`)
                    }
                >
                    Xem chi tiết
                </Button>
            ),
        },
    ];

    return (
        <Stack spacing={3}>
            <Box>
                <Typography variant="h4" fontWeight={800}>
                    Quản lý đặt chỗ theo tour
                </Typography>
                <Typography color="text.secondary">
                    Theo dõi tour nào có booking, số khách và tình trạng thanh toán.
                </Typography>
            </Box>

            <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Tìm theo tên tour hoặc slug"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={1.5}
                            justifyContent="flex-end"
                        >
                            <Button variant="contained" onClick={handleSearch}>
                                Tìm kiếm
                            </Button>
                            <Button variant="outlined" onClick={handleReset}>
                                Đặt lại
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>
            </Paper>

            {error && <Alert severity="error">{error}</Alert>}

            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
                {loading ? (
                    <Box display="flex" justifyContent="center" py={8}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <DataGrid
                        rows={items}
                        columns={columns}
                        getRowId={(row) => row.tourId}
                        autoHeight
                        disableRowSelectionOnClick
                        paginationMode="server"
                        rowCount={meta.total}
                        paginationModel={{
                            page: meta.page - 1,
                            pageSize: meta.limit,
                        }}
                        onPaginationModelChange={(model) => {
                            const keyword = search.trim();

                            fetchData({
                                page: model.page + 1,
                                limit: model.pageSize,
                                ...(keyword ? { search: keyword } : {}),
                            });
                        }}
                        pageSizeOptions={[10, 20, 50]}
                    />
                )}
            </Paper>
        </Stack>
    );
}