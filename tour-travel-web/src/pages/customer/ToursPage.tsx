import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CardMedia,
    Chip,
    CircularProgress,
    MenuItem,
    Pagination,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import destinationPublicService from '../../services/public/destinationPublicService';
import tourPublicService from '../../services/public/tourPublicService';
import { IDestination } from '../../types/destination';
import { Tour, TourQueryParams } from '../../types/tour';

const budgetOptions = [
    { label: 'Tất cả ngân sách', value: '' },
    { label: 'Dưới 3 triệu', value: '0-3000000' },
    { label: '3 - 5 triệu', value: '3000000-5000000' },
    { label: '5 - 10 triệu', value: '5000000-10000000' },
    { label: '10 - 20 triệu', value: '10000000-20000000' },
    { label: 'Trên 20 triệu', value: '20000000-' },
];

const tourTypeOptions = [
    { label: 'Tất cả loại tour', value: '' },
    { label: 'Tour tiết kiệm', value: 'budget' },
    { label: 'Tour tiêu chuẩn', value: 'standard' },
    { label: 'Tour cao cấp', value: 'premium' },
    { label: 'Tour gia đình', value: 'family' },
    { label: 'Tour riêng / private', value: 'private' },
];

const durationOptions = [
    { label: 'Tất cả thời lượng', value: '' },
    { label: '1 ngày', value: '1-1' },
    { label: '2 - 3 ngày', value: '2-3' },
    { label: '4 - 5 ngày', value: '4-5' },
    { label: '6 - 7 ngày', value: '6-7' },
    { label: 'Từ 8 ngày trở lên', value: '8-' },
];

const featureOptions = [
    { label: 'Tất cả đặc điểm', value: '' },
    { label: 'Biển đảo', value: 'beach' },
    { label: 'Nghỉ dưỡng', value: 'resort' },
    { label: 'Khám phá', value: 'explore' },
    { label: 'Văn hóa', value: 'culture' },
    { label: 'Mạo hiểm', value: 'adventure' },
    { label: 'Team building', value: 'team-building' },
];

const departureTimeOptions = [
    { label: 'Tất cả ngày đi', value: '' },
    { label: '7 ngày tới', value: '7-days' },
    { label: '30 ngày tới', value: '30-days' },
    { label: '3 tháng tới', value: '3-months' },
    { label: 'Chọn ngày cụ thể', value: 'custom' },
];

export default function ToursPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [destinationId, setDestinationId] = useState(
        searchParams.get('destinationId') || '',
    );
    const [page, setPage] = useState(Number(searchParams.get('page') || 1));

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [items, setItems] = useState<Tour[]>([]);
    const [destinations, setDestinations] = useState<IDestination[]>([]);
    const [meta, setMeta] = useState({
        page: 1,
        limit: 9,
        total: 0,
        totalPages: 1,
    });

    const [budgetRange, setBudgetRange] = useState('');
    const [tourType, setTourType] = useState('');
    const [durationRange, setDurationRange] = useState('');
    const [feature, setFeature] = useState('');
    const [departureTime, setDepartureTime] = useState('');
    const [departureDate, setDepartureDate] = useState('');

    useEffect(() => {
        const fetchDestinations = async () => {
            try {
                const response = await destinationPublicService.getList({
                    page: 1,
                    limit: 1000,
                });
                setDestinations(response.data || []);
            } catch {
                // Ignore destination filter failure.
            }
        };

        fetchDestinations();
    }, []);

    useEffect(() => {
        fetchTours();
    }, [page, searchParams]);

    const fetchTours = async (params?: Partial<TourQueryParams>) => {
        try {
            setLoading(true);
            setError('');

            const finalParams: Omit<TourQueryParams, 'status'> = {
                page: params?.page || page,
                limit: params?.limit || 9,
            };

            if (search.trim()) {
                finalParams.search = search.trim();
            }

            if (destinationId) {
                finalParams.destinationId = Number(destinationId);
            }

            // merge thêm filter từ ngoài vào
            Object.assign(finalParams, params);

            const response = await tourPublicService.getPaging(finalParams);

            setItems(response.items || []);
            setMeta(response.meta);
        } catch (err: any) {
            setError(
                err?.response?.data?.message || 'Không tải được danh sách tour',
            );
        } finally {
            setLoading(false);
        }
    };

    const destinationMap = useMemo(() => {
        return new Map(destinations.map((item) => [String(item.id), item.name]));
    }, [destinations]);

    const parseRange = (value: string) => {
        if (!value) {
            return {};
        }

        const [min, max] = value.split('-');

        return {
            min: min ? Number(min) : undefined,
            max: max ? Number(max) : undefined,
        };
    };

    const formatDateParam = (date: Date) => {
        return date.toISOString().slice(0, 10);
    };

    const getDepartureDateRange = () => {
        const today = new Date();

        if (departureTime === '7-days') {
            const to = new Date();
            to.setDate(today.getDate() + 7);

            return {
                departureFrom: formatDateParam(today),
                departureTo: formatDateParam(to),
            };
        }

        if (departureTime === '30-days') {
            const to = new Date();
            to.setDate(today.getDate() + 30);

            return {
                departureFrom: formatDateParam(today),
                departureTo: formatDateParam(to),
            };
        }

        if (departureTime === '3-months') {
            const to = new Date();
            to.setMonth(today.getMonth() + 3);

            return {
                departureFrom: formatDateParam(today),
                departureTo: formatDateParam(to),
            };
        }

        if (departureTime === 'custom' && departureDate) {
            return {
                departureFrom: departureDate,
                departureTo: departureDate,
            };
        }

        return {};
    };

    const buildFilterParams = (): Partial<TourQueryParams> => {
        const priceRange = parseRange(budgetRange);
        const duration = parseRange(durationRange);
        const departureRange = getDepartureDateRange();

        const params: Partial<TourQueryParams> = {};

        const keyword = search.trim();

        if (keyword) {
            params.search = keyword;
        }

        if (destinationId) {
            params.destinationId = Number(destinationId);
        }

        if (priceRange.min !== undefined) {
            params.priceMin = priceRange.min;
        }

        if (priceRange.max !== undefined) {
            params.priceMax = priceRange.max;
        }

        if (duration.min !== undefined) {
            params.durationMin = duration.min;
        }

        if (duration.max !== undefined) {
            params.durationMax = duration.max;
        }

        if (tourType) {
            params.tourType = tourType;
        }

        if (feature) {
            params.feature = feature;
        }

        if (departureRange.departureFrom) {
            params.departureFrom = departureRange.departureFrom;
        }

        if (departureRange.departureTo) {
            params.departureTo = departureRange.departureTo;
        }

        return params;
    };

    const handleFilter = () => {
        fetchTours({
            page: 1,
            limit: meta.limit,
            ...buildFilterParams(),
        });
    };

    const handleReset = () => {
        setSearch('');
        setDestinationId('');
        setBudgetRange('');
        setTourType('');
        setDurationRange('');
        setFeature('');
        setDepartureTime('');
        setDepartureDate('');

        fetchTours({
            page: 1,
            limit: meta.limit,
        });
    };

    const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
        const next = new URLSearchParams(searchParams);
        next.set('page', String(value));
        setSearchParams(next);
    };

    const formatMoney = (value?: string | number | null) => {
        if (value === undefined || value === null || value === '') {
            return 'Liên hệ';
        }

        const numberValue = Number(value);

        if (Number.isNaN(numberValue)) {
            return 'Liên hệ';
        }

        return `${numberValue.toLocaleString('vi-VN')} đ`;
    };

    const getActivePackages = (tour: Tour) => {
        return (tour.packages || []).filter((item) => item.status === 'active');
    };

    const getDefaultOrLowestPackage = (tour: Tour) => {
        const activePackages = getActivePackages(tour);

        if (activePackages.length === 0) {
            return undefined;
        }

        const defaultPackage = activePackages.find((item) => item.isDefault);

        if (defaultPackage) {
            return defaultPackage;
        }

        return [...activePackages].sort(
            (a, b) => Number(a.priceAdult) - Number(b.priceAdult),
        )[0];
    };

    const getTourPrice = (tour: Tour) => {
        const tourPackage = getDefaultOrLowestPackage(tour);
        return tourPackage?.priceAdult;
    };


    const formatDepartureDate = (value?: string) => {
        if (!value) return '';

        return new Date(value).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };





    return (
        <Stack spacing={4}>
            <Paper
                sx={{
                    p: { xs: 3, md: 5 },
                    borderRadius: 4,
                    background:
                        'linear-gradient(135deg, rgba(12,74,110,0.95) 0%, rgba(14,116,144,0.92) 45%, rgba(251,191,36,0.9) 100%)',
                    color: '#fff',
                }}
            >
                <Stack spacing={2}>
                    <Chip
                        label="Tour du lịch"
                        sx={{
                            alignSelf: 'flex-start',
                            bgcolor: 'rgba(255,255,255,0.18)',
                            color: '#fff',
                            fontWeight: 700,
                        }}
                    />
                    <Typography variant="h3" fontWeight={800}>
                        Chọn hành trình phù hợp với lịch trình của bạn
                    </Typography>
                    <Typography sx={{ maxWidth: 760, color: 'rgba(255,255,255,0.88)' }}>
                        Lọc theo điểm đến, xem đợt khởi hành đang mở và chọn gói tour
                        phù hợp ngay trên trang chi tiết.
                    </Typography>
                </Stack>
            </Paper>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">

                {/* Bộ lọc */}
                <Paper
                    elevation={0}
                    sx={{
                        width: { xs: '100%', md: 260 },
                        flexShrink: 0,
                        borderRadius: 2,
                        p: 2,
                        border: '1px solid #eef0f3',
                    }}
                >
                    <Typography fontWeight={900} sx={{ textTransform: 'uppercase', mb: 2 }}>
                        Bộ lọc tìm kiếm
                    </Typography>

                    <Stack spacing={2}>
                        {/* Từ khóa */}
                        <Box>
                            <Typography fontSize={13} fontWeight={800} mb={1}>
                                Từ khóa
                            </Typography>
                            <TextField
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tên tour"
                                size="small"
                                fullWidth
                            />
                        </Box>

                        {/* Điểm đến */}
                        <Box>
                            <Typography fontSize={13} fontWeight={800} mb={1}>
                                Điểm đến
                            </Typography>
                            <TextField
                                select
                                value={destinationId}
                                onChange={(e) => setDestinationId(e.target.value)}
                                size="small"
                                fullWidth
                            >
                                <MenuItem value="">Tất cả</MenuItem>
                                {destinations.map((item) => (
                                    <MenuItem key={item.id} value={String(item.id)}>
                                        {item.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>
                        <Box>
                            <Typography fontSize={13} fontWeight={800} mb={1}>
                                Ngân sách / Giá tour
                            </Typography>

                            <TextField
                                select
                                value={budgetRange}
                                onChange={(e) => setBudgetRange(e.target.value)}
                                size="small"
                                fullWidth
                            >
                                {budgetOptions.map((item) => (
                                    <MenuItem key={item.value} value={item.value}>
                                        {item.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>

                        <Box>
                            <Typography fontSize={13} fontWeight={800} mb={1}>
                                Loại tour / Dòng tour
                            </Typography>

                            <TextField
                                select
                                value={tourType}
                                onChange={(e) => setTourType(e.target.value)}
                                size="small"
                                fullWidth
                            >
                                {tourTypeOptions.map((item) => (
                                    <MenuItem key={item.value} value={item.value}>
                                        {item.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>

                        <Box>
                            <Typography fontSize={13} fontWeight={800} mb={1}>
                                Thời gian / Thời lượng tour
                            </Typography>

                            <TextField
                                select
                                value={durationRange}
                                onChange={(e) => setDurationRange(e.target.value)}
                                size="small"
                                fullWidth
                            >
                                {durationOptions.map((item) => (
                                    <MenuItem key={item.value} value={item.value}>
                                        {item.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>

                        <Box>
                            <Typography fontSize={13} fontWeight={800} mb={1}>
                                Thể loại / Đặc điểm tour
                            </Typography>

                            <TextField
                                select
                                value={feature}
                                onChange={(e) => setFeature(e.target.value)}
                                size="small"
                                fullWidth
                            >
                                {featureOptions.map((item) => (
                                    <MenuItem key={item.value} value={item.value}>
                                        {item.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>

                        <Box>
                            <Typography fontSize={13} fontWeight={800} mb={1}>
                                Thời gian khởi hành / Ngày đi
                            </Typography>

                            <TextField
                                select
                                value={departureTime}
                                onChange={(e) => {
                                    setDepartureTime(e.target.value);

                                    if (e.target.value !== 'custom') {
                                        setDepartureDate('');
                                    }
                                }}
                                size="small"
                                fullWidth
                            >
                                {departureTimeOptions.map((item) => (
                                    <MenuItem key={item.value} value={item.value}>
                                        {item.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>

                        {departureTime === 'custom' && (
                            <Box>
                                <Typography fontSize={13} fontWeight={800} mb={1}>
                                    Chọn ngày đi
                                </Typography>

                                <TextField
                                    type="date"
                                    value={departureDate}
                                    onChange={(e) => setDepartureDate(e.target.value)}
                                    size="small"
                                    fullWidth
                                />
                            </Box>
                        )}

                        <Button variant="contained" onClick={handleFilter} sx={{ textTransform: 'none', fontWeight: 800 }}>
                            Áp dụng
                        </Button>
                        <Button variant="outlined" onClick={handleReset} sx={{ textTransform: 'none', fontWeight: 800 }}>
                            Đặt lại
                        </Button>
                    </Stack>
                </Paper>

                {/* Danh sách tour */}
                <Stack spacing={2} sx={{ flex: 1 }}>
                    <Stack direction="row" justifyContent="space-between">
                        <Typography variant="h5" fontWeight={800}>
                            Danh sách tour
                        </Typography>
                        <Typography color="text.secondary">{meta.total} tour phù hợp</Typography>
                    </Stack>

                    {error && <Alert severity="error">{error}</Alert>}

                    {loading ? (
                        <Box display="flex" justifyContent="center" py={8}>
                            <CircularProgress />
                        </Box>
                    ) : items.length === 0 ? (
                        <Paper sx={{ p: 5, borderRadius: 4, textAlign: 'center' }}>
                            <Stack spacing={1.5} alignItems="center">
                                <Typography variant="h6" fontWeight={700}>
                                    Chưa có tour phù hợp
                                </Typography>
                                <Typography color="text.secondary">
                                    Hãy thử đổi từ khóa tìm kiếm hoặc chọn điểm đến khác.
                                </Typography>
                            </Stack>
                        </Paper>
                    ) : (
                        <Stack spacing={2}>
                            {items.map((item) => {
                                const displayPackage = getDefaultOrLowestPackage(item);

                                const displayImage =
                                    item.images?.find((img) => img.isDefault)?.url ||
                                    item.images?.[0]?.url ||
                                    '';
                                console.log('TOUR ITEM:', item);
                                console.log('TOUR ID:', item.id);
                                console.log('TOUR NAME:', item.name);
                                console.log('TOUR IMAGES:', item.images);
                                // console.log('DEFAULT IMAGE:', defaultImage);
                                // console.log('FIRST IMAGE:', firstImage);
                                // console.log('COVER IMAGE URL:', item.coverImageUrl);
                                console.log('DISPLAY IMAGE:', displayImage);

                                return (
                                    <Card
                                        key={item.id}
                                        sx={{
                                            display: 'flex',
                                            flexDirection: { xs: 'column', md: 'row' },
                                            borderRadius: 2,
                                            overflow: 'hidden',
                                            border: '1px solid #e5e7eb',
                                            boxShadow: '0 10px 24px rgba(15, 23, 42, 0.06)',
                                        }}
                                    >
                                        {/* Ảnh bên trái */}
                                        <Box
                                            sx={{
                                                width: { xs: '100%', md: 300 },
                                                height: { xs: 220, md: 210 },
                                                flexShrink: 0,
                                                position: 'relative',
                                                bgcolor: '#f1f5f9',
                                            }}
                                        >
                                            {/* {item.coverImageUrl ? (
                                                <CardMedia
                                                    component="img"
                                                    image={item.coverImageUrl}
                                                    alt={item.name}
                                                    sx={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                    }}
                                                />
                                            ) : (
                                                <Box
                                                    sx={{
                                                        width: '100%',
                                                        height: '100%',
                                                        background:
                                                            'linear-gradient(135deg, #0f766e 0%, #14b8a6 50%, #99f6e4 100%)',
                                                    }}
                                                />
                                            )} */}



                                            {displayImage ? (
                                                <CardMedia
                                                    component="img"
                                                    image={displayImage}
                                                    alt={item.name}
                                                    sx={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                    }}
                                                />
                                            ) : (
                                                <Box
                                                    sx={{
                                                        width: '100%',
                                                        height: '100%',
                                                        background:
                                                            'linear-gradient(135deg, #0f766e 0%, #14b8a6 50%, #99f6e4 100%)',
                                                    }}
                                                />
                                            )}

                                            {displayPackage?.name && (
                                                <Chip
                                                    size="small"
                                                    label={displayPackage.name}
                                                    sx={{
                                                        position: 'absolute',
                                                        left: 12,
                                                        bottom: 12,
                                                        bgcolor: '#0f766e',
                                                        color: '#fff',
                                                        fontWeight: 800,
                                                    }}
                                                />
                                            )}
                                        </Box>

                                        {/* Thông tin bên phải */}
                                        <CardContent
                                            sx={{
                                                flex: 1,
                                                p: 2.5,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <Stack spacing={1.5}>
                                                <Typography
                                                    variant="h6"
                                                    fontWeight={800}
                                                    sx={{
                                                        lineHeight: 1.35,
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    {item.name}
                                                </Typography>

                                                <Box
                                                    sx={{
                                                        display: 'grid',
                                                        gridTemplateColumns: {
                                                            xs: '1fr',
                                                            sm: '3fr 2fr',
                                                        },
                                                        gap: 1,
                                                    }}
                                                >
                                                    <Typography variant="body2" color="text.secondary">
                                                        <strong>Mã tour:</strong> {item.slug}
                                                    </Typography>

                                                    <Typography variant="body2" color="text.secondary">
                                                        <strong>Gói tour:</strong>{' '}
                                                        {item.defaultPackageName || 'Đang cập nhật'}
                                                    </Typography>

                                                    <Typography variant="body2" color="text.secondary">
                                                        <strong>Thời gian:</strong>{' '}
                                                        {item.durationDays}N{item.durationNights}Đ
                                                    </Typography>

                                                    <Typography variant="body2" color="text.secondary">
                                                        <strong>Gói hoạt động:</strong>{' '}
                                                        {item.activePackageCount ?? getActivePackages(item).length}
                                                    </Typography>
                                                </Box>
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    flexWrap="wrap"
                                                    useFlexGap
                                                    alignItems="center"
                                                >
                                                    <Typography variant="body2" color="text.secondary">
                                                        <strong>Ngày khởi hành:</strong>
                                                    </Typography>

                                                    {item.upcomingDepartures && item.upcomingDepartures.length > 0 ? (
                                                        item.upcomingDepartures.map((departure) => (
                                                            <Chip
                                                                key={departure.id}
                                                                size="small"
                                                                label={formatDepartureDate(departure.departureDate)}
                                                                variant="outlined"
                                                                color={departure.status === 'full' ? 'warning' : 'default'}
                                                            />
                                                        ))
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">
                                                            Chưa có lịch mở
                                                        </Typography>
                                                    )}
                                                </Stack>
                                            </Stack>

                                            <Box
                                                sx={{

                                                    display: 'flex',
                                                    alignItems: 'flex-end',
                                                    justifyContent: 'space-between',
                                                    gap: 2,
                                                    flexWrap: 'wrap',
                                                }}
                                            >
                                                <Box>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Giá từ:{' '}
                                                        <Typography
                                                            component="span"
                                                            sx={{
                                                                color: '#e11d48',
                                                                fontWeight: 900,
                                                                fontSize: { xs: '1.35rem', md: '1.6rem' },
                                                                lineHeight: 1.2,
                                                            }}
                                                        >
                                                            {item.priceFrom
                                                                ? `${Number(item.priceFrom).toLocaleString('vi-VN')} đ`
                                                                : 'Liên hệ'}
                                                        </Typography>
                                                    </Typography>

                                                </Box>

                                                <Button
                                                    variant="contained"
                                                    onClick={() => navigate(`/tours/${item.slug}`)}
                                                    sx={{
                                                        minWidth: 130,
                                                        height: 40,
                                                        fontWeight: 800,
                                                        textTransform: 'none',
                                                        borderRadius: 1.5,
                                                    }}
                                                >
                                                    Xem chi tiết
                                                </Button>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </Stack>
                    )}

                    <Box display="flex" justifyContent="center">
                        <Pagination
                            page={meta.page}
                            count={Math.max(meta.totalPages, 1)}
                            onChange={handlePageChange}
                            color="primary"
                        />
                    </Box>
                </Stack>
            </Stack>
        </Stack>
    );
}
