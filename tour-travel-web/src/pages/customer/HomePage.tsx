import React, { useEffect, useMemo, useState } from 'react';
import {
    AppBar,
    Box,
    Button,
    Card,
    CardContent,
    CardMedia,
    Chip,
    Container,
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    Toolbar,
    Typography,
} from '@mui/material';

import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HotelIcon from '@mui/icons-material/Hotel';
import GroupsIcon from '@mui/icons-material/Groups';
import PaymentsIcon from '@mui/icons-material/Payments';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import VerifiedIcon from '@mui/icons-material/Verified';
import StarIcon from '@mui/icons-material/Star';
import EmailIcon from '@mui/icons-material/Email';
import FacebookIcon from '@mui/icons-material/Facebook';
import YouTubeIcon from '@mui/icons-material/YouTube';
import InstagramIcon from '@mui/icons-material/Instagram';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';

import { CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import destinationPublicService from '../../services/public/destinationPublicService';
import {
    DestinationRegion,
    DestinationType,
    IDestination,
} from '../../types/destination';
import { Tour } from '../../types/tour';
import tourPublicService from '../../services/public/tourPublicService';

const heroImage =
    'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1600&auto=format&fit=crop';

const testimonials = [
    {
        name: 'Nguyễn Minh Anh',
        city: 'Hà Nội',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
        content: 'Tour rất chất lượng, hướng dẫn viên nhiệt tình, lịch trình hợp lý và nhiều trải nghiệm đáng nhớ. Chắc chắn sẽ tiếp tục đồng hành cùng Viettravel!',
    },
    {
        name: 'Trần Quốc Bảo',
        city: 'TP. Hồ Chí Minh',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
        content: 'Dịch vụ hỗ trợ nhanh chóng, từ khâu tư vấn đến khi kết thúc chuyến đi đều rất chuyên nghiệp. Rất hài lòng!',
    },
    {
        name: 'Lê Thị Hương',
        city: 'Đà Nẵng',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
        content: 'Gia đình mình đã có kỳ nghỉ tuyệt vời tại Phú Quốc. Cảm ơn Viettravel đã mang đến trải nghiệm trọn vẹn và đáng nhớ.',
    },
];

type DestinationTab =
    | { label: string; query: 'ALL' }
    | { label: string; region: DestinationRegion }
    | { label: string; destinationType: DestinationType };

const destinationTabs: DestinationTab[] = [
    { label: 'Tất cả', query: 'ALL' },
    { label: 'Miền Bắc', region: 'NORTH' },
    { label: 'Miền Trung', region: 'CENTRAL' },
    { label: 'Miền Nam', region: 'SOUTH' },
    { label: 'Tây Nguyên', region: 'HIGHLANDS' },
    { label: 'Nước ngoài', region: 'INTERNATIONAL' },
    { label: 'Biển đảo', destinationType: 'ISLAND' },
];
const defaultDestinationTab: DestinationTab = {
    label: 'Tất cả',
    query: 'ALL',
};

// const fallbackDestinationImage =
//     'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=900&auto=format&fit=crop';

const fallbackTourImage =
    'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=900&auto=format&fit=crop';

const getDestinationGridStyle = (index: number) => {
    if (index === 0) {
        return {
            gridSize: { xs: 12, md: 4 },
            height: 420,
        };
    }

    if (index === 7) {
        return {
            gridSize: { xs: 12, md: 8 },
            height: 200,
        };
    }

    return {
        gridSize: { xs: 6, md: 4 },
        height: 200,
    };
};

const SectionTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <Box textAlign="center" mb={4}>
        <Typography
            variant="h4"
            fontWeight={800}
            color="primary"
            textTransform="uppercase"
            letterSpacing={1}
        >
            {title}
        </Typography>
        <Box sx={{ width: 70, height: 3, bgcolor: 'primary.main', mx: 'auto', mt: 1, mb: 2, borderRadius: 99 }} />
        {subtitle && (
            <Typography color="text.secondary" maxWidth={720} mx="auto">
                {subtitle}
            </Typography>
        )}
    </Box>
);

const HomePage: React.FC = () => {
    const navigate = useNavigate();

    const [destinations, setDestinations] = useState<IDestination[]>([]);

    const [featuredTours, setFeaturedTours] = useState<Tour[]>([]);
    const [goodPriceTours, setGoodPriceTours] = useState<Tour[]>([]);
    const [loadingTours, setLoadingTours] = useState(false);


    const [selectedDestinationTab, setSelectedDestinationTab] =
        useState<DestinationTab>(defaultDestinationTab);
    const [destinationLoading, setDestinationLoading] = useState(false);

    useEffect(() => {
        const fetchHomeTours = async () => {
            try {
                setLoadingTours(true);

                const [featuredResponse, hotDealResponse] = await Promise.all([
                    tourPublicService.getPaging({
                        page: 1,
                        limit: 4,
                        isFeatured: true,
                    }),
                    tourPublicService.getPaging({
                        page: 1,
                        limit: 8,
                        isHotDeal: true,
                    }),
                ]);

                setFeaturedTours(featuredResponse.items || []);
                setGoodPriceTours(hotDealResponse.items || []);
            } catch (error) {
                console.error('Fetch home tours failed:', error);
                setFeaturedTours([]);
                setGoodPriceTours([]);
            } finally {
                setLoadingTours(false);
            }
        };

        fetchHomeTours();
    }, []);

    useEffect(() => {
        const fetchDestinations = async () => {
            setDestinationLoading(true);

            try {
                const params = {
                    page: 1,
                    limit: 8,
                    isFeatured: true,
                    ...('region' in selectedDestinationTab
                        ? { region: selectedDestinationTab.region }
                        : {}),
                    ...('destinationType' in selectedDestinationTab
                        ? { destinationType: selectedDestinationTab.destinationType }
                        : {}),
                };

                const response = await destinationPublicService.getList(params);

                const pagingResponse = response as typeof response & {
                    items?: IDestination[];
                    data?: IDestination[];
                };

                setDestinations(pagingResponse.items ?? pagingResponse.data ?? []);
            } catch (error) {
                console.error('Lỗi lấy danh sách điểm đến:', error);
                setDestinations([]);
            } finally {
                setDestinationLoading(false);
            }
        };

        fetchDestinations();
    }, [selectedDestinationTab]);

    const handleDestinationClick = (destination: IDestination) => {
        navigate(`/tours?destinationId=${destination.id}`);
    };

    const formatCurrency = (value?: string | number | null) => {
        if (value === undefined || value === null || value === '') {
            return 'Liên hệ';
        }

        return `${Number(value).toLocaleString('vi-VN')} đ`;
    };

    const getTourImage = (tour: any) => {
        return (
            tour.coverImageUrl ||
            tour.defaultImageUrl ||
            tour.images?.[0]?.url ||
            fallbackTourImage
        );
    };

    const getTourDuration = (tour: any) => {
        if (tour.durationDays && tour.durationNights !== undefined) {
            return `${tour.durationDays} ngày ${tour.durationNights} đêm`;
        }

        return 'Lịch trình linh hoạt';
    };

    const getDisplayPrice = (tour: Tour) => {
        return tour.minSalePrice ?? tour.priceFrom ?? null;
    };

    const getOriginalPrice = (tour: Tour) => {
        return tour.minOriginalPrice ?? tour.priceFrom ?? null;
    };

    const hasDiscount = (tour: Tour) => {
        return (
            Number(tour.discountPercent || 0) > 0 &&
            Number(getOriginalPrice(tour) || 0) > Number(getDisplayPrice(tour) || 0)
        );
    };

    const getSavedAmount = (tour: Tour) => {
        return Math.max(
            0,
            Number(getOriginalPrice(tour) || 0) - Number(getDisplayPrice(tour) || 0),
        );
    };

    return (
        <Box sx={{ bgcolor: '#fff' }}>

            {/* HERO */}
            <Box sx={{
                width: '100vw',
                marginLeft: 'calc(50% - 50vw)',
                minHeight: 400,
                backgroundImage: `linear-gradient(90deg, rgba(0,36,74,.82), rgba(0,36,74,.3)), url(${heroImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
                pb: 10,
            }}>
                <Container maxWidth="lg">
                    <Box maxWidth={760}>
                        <Typography sx={{ fontFamily: 'cursive', fontSize: { xs: 36, md: 54 }, mb: 0.5 }}>
                            Khám phá
                        </Typography>
                        <Typography variant="h2" fontWeight={900} sx={{ fontSize: { xs: 34, md: 60 }, textTransform: 'uppercase', lineHeight: 1.1 }}>
                            Hành trình mơ ước
                        </Typography>
                        <Typography mt={2} fontSize={17}>
                            Trải nghiệm tour chọn lọc – Dịch vụ tận tâm – Giá tốt mỗi ngày
                        </Typography>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} mt={3} color="rgba(255,255,255,.9)">
                            <Stack direction="row" spacing={1} alignItems="center">
                                <VerifiedIcon fontSize="small" />
                                <Typography fontSize={14}>Uy tín hàng đầu</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <WorkspacePremiumIcon fontSize="small" />
                                <Typography fontSize={14}>Hơn 10 năm kinh nghiệm</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <GroupsIcon fontSize="small" />
                                <Typography fontSize={14}>Hàng nghìn khách tin chọn</Typography>
                            </Stack>
                        </Stack>
                    </Box>
                </Container>

                {/* SEARCH BOX - absolute at bottom edge, overlapping next section */}
                <Box sx={{ position: 'absolute', bottom: -36, left: 0, right: 0, zIndex: 10 }}>
                    <Container maxWidth="lg">
                        <Card sx={{ p: 2, borderRadius: 4, boxShadow: '0 20px 50px rgba(0,0,0,.22)' }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid size={{ xs: 12, md: 2.4 }}>
                                    <TextField fullWidth label="Điểm đi" placeholder="Chọn điểm đi"
                                        InputProps={{ startAdornment: <InputAdornment position="start"><LocationOnIcon color="primary" /></InputAdornment> }} />
                                </Grid>
                                <Grid size={{ xs: 12, md: 2.4 }}>
                                    <TextField fullWidth label="Điểm đến" placeholder="Chọn điểm đến"
                                        InputProps={{ startAdornment: <InputAdornment position="start"><LocationOnIcon color="primary" /></InputAdornment> }} />
                                </Grid>
                                <Grid size={{ xs: 12, md: 2.4 }}>
                                    <TextField fullWidth label="Ngày khởi hành" placeholder="Chọn ngày"
                                        InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonthIcon color="primary" /></InputAdornment> }} />
                                </Grid>
                                <Grid size={{ xs: 12, md: 2 }}>
                                    <TextField fullWidth label="Số khách" placeholder="1 khách"
                                        InputProps={{ startAdornment: <InputAdornment position="start"><GroupsIcon color="primary" /></InputAdornment> }} />
                                </Grid>
                                <Grid size={{ xs: 12, md: 2.8 }}>
                                    <Button fullWidth variant="contained" size="large" startIcon={<SearchIcon />}
                                        sx={{ height: '100%', minHeight: 56, borderRadius: 2, fontSize: 15, fontWeight: 700 }}>
                                        Tìm kiếm tour
                                    </Button>
                                </Grid>
                            </Grid>
                        </Card>
                    </Container>
                </Box>
            </Box>

            {/* USP STRIP */}
            <Container maxWidth="lg">
                <Grid container spacing={2} sx={{ pt: 10, pb: 4 }}>
                    {[
                        { icon: <PaymentsIcon />, title: 'Giá tốt mỗi ngày', desc: 'Cam kết giá cạnh tranh nhất' },
                        { icon: <CalendarMonthIcon />, title: 'Lịch trình chọn lọc', desc: 'Tối ưu trải nghiệm của bạn' },
                        { icon: <SupportAgentIcon />, title: 'Hỗ trợ 24/7', desc: 'Đội ngũ tư vấn tận tâm' },
                        { icon: <VerifiedIcon />, title: 'Thanh toán linh hoạt', desc: 'An toàn, nhanh chóng, tiện lợi' },
                    ].map((item) => (
                        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item.title}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: '#e3f2fd', color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {item.icon}
                                </Box>
                                <Box>
                                    <Typography fontWeight={800}>{item.title}</Typography>
                                    <Typography fontSize={14} color="text.secondary">{item.desc}</Typography>
                                </Box>
                            </Stack>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            <Divider />

            {/* FEATURED TOURS */}
            <Box py={7}>
                <Container maxWidth="lg">
                    <SectionTitle
                        title="Tour nổi bật"
                        subtitle="Những hành trình được khách hàng yêu thích nhất"
                    />

                    {loadingTours ? (
                        <Stack alignItems="center" justifyContent="center" py={6}>
                            <CircularProgress />
                            <Typography mt={2} color="text.secondary">
                                Đang tải tour nổi bật...
                            </Typography>
                        </Stack>
                    ) : featuredTours.length === 0 ? (
                        <Box
                            sx={{
                                py: 6,
                                textAlign: 'center',
                                bgcolor: '#f8fafc',
                                borderRadius: 4,
                            }}
                        >
                            <Typography fontWeight={800} color="text.secondary">
                                Chưa có tour nổi bật
                            </Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={3}>
                            {featuredTours.map((tour) => (
                                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={tour.id}>
                                    <Card
                                        sx={{
                                            height: '100%',
                                            borderRadius: 3,
                                            overflow: 'hidden',
                                            cursor: 'pointer',
                                            transition: '0.25s',
                                            boxShadow: '0 10px 30px rgba(15,23,42,.1)',
                                            '&:hover': {
                                                transform: 'translateY(-6px)',
                                                boxShadow: '0 18px 40px rgba(15,23,42,.16)',
                                            },
                                        }}
                                        onClick={() => navigate(`/tours/${tour.slug}`)}
                                    >
                                        <Box position="relative">
                                            <CardMedia
                                                component="img"
                                                height="180"
                                                image={getTourImage(tour)}
                                                alt={tour.name}
                                            />

                                            <Chip
                                                label="Nổi bật"
                                                size="small"
                                                sx={{
                                                    position: 'absolute',
                                                    top: 12,
                                                    left: 12,
                                                    bgcolor: '#ef4444',
                                                    color: '#fff',
                                                    fontWeight: 800,
                                                }}
                                            />

                                            {hasDiscount(tour) && (
                                                <Chip
                                                    label={`-${tour.discountPercent}%`}
                                                    size="small"
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 12,
                                                        right: 12,
                                                        bgcolor: '#f59e0b',
                                                        color: '#fff',
                                                        fontWeight: 800,
                                                    }}
                                                />
                                            )}
                                        </Box>

                                        <CardContent>
                                            <Typography fontWeight={800} minHeight={48} gutterBottom>
                                                {tour.name}
                                            </Typography>

                                            <Stack direction="row" spacing={0.8} alignItems="center" mb={0.5}>
                                                <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                <Typography fontSize={13} color="text.secondary">
                                                    {getTourDuration(tour)}
                                                </Typography>
                                            </Stack>

                                            <Stack direction="row" spacing={0.8} alignItems="center">
                                                <CalendarMonthIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                <Typography fontSize={13} color="text.secondary">
                                                    {tour.openDepartureCount
                                                        ? `${tour.openDepartureCount} lịch khởi hành`
                                                        : 'Liên hệ lịch khởi hành'}
                                                </Typography>
                                            </Stack>

                                            <Stack
                                                direction="row"
                                                justifyContent="space-between"
                                                alignItems="center"
                                                mt={2}
                                            >
                                                <Box>
                                                    {hasDiscount(tour) && (
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{ textDecoration: 'line-through' }}
                                                        >
                                                            {formatCurrency(getOriginalPrice(tour))}
                                                        </Typography>
                                                    )}

                                                    <Typography color="error" fontWeight={900} fontSize={16}>
                                                        {formatCurrency(getDisplayPrice(tour))}
                                                    </Typography>
                                                </Box>

                                                <Button
                                                    size="small"
                                                    endIcon={<ArrowForwardIcon />}
                                                    sx={{ fontSize: 12 }}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        navigate(`/tours/${tour.slug}`);
                                                    }}
                                                >
                                                    Chi tiết
                                                </Button>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Container>
            </Box>

            {/* COMBO GOOD PRICE */}
            <Box py={7} sx={{ bgcolor: '#eaf6ff' }}>
                <Container maxWidth="lg">
                    <SectionTitle
                        title="Combo giá tốt"
                        subtitle="Tiết kiệm hơn khi đặt combo vé máy bay và khách sạn cùng tour. Giá tốt - Dịch vụ tốt - Trải nghiệm trọn vẹn."
                    />

                    <Stack direction="row" spacing={1.5} justifyContent="center" flexWrap="wrap" mb={4} useFlexGap>
                        {['Tất cả', 'Miền Bắc', 'Miền Trung', 'Miền Nam', 'Combo quốc tế'].map((item, index) => (
                            <Chip
                                key={item}
                                label={item}
                                color={index === 0 ? 'primary' : 'default'}
                                variant={index === 0 ? 'filled' : 'outlined'}
                                sx={{ px: 2, fontWeight: 700 }}
                            />
                        ))}
                    </Stack>

                    {loadingTours ? (
                        <Stack alignItems="center" justifyContent="center" py={6}>
                            <CircularProgress />
                            <Typography mt={2} color="text.secondary">
                                Đang tải combo giá tốt...
                            </Typography>
                        </Stack>
                    ) : goodPriceTours.length === 0 ? (
                        <Box
                            sx={{
                                py: 6,
                                textAlign: 'center',
                                bgcolor: '#fff',
                                borderRadius: 4,
                            }}
                        >
                            <Typography fontWeight={800} color="text.secondary">
                                Chưa có combo giá tốt
                            </Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={2}>
                            {goodPriceTours.map((tour) => (
                                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={tour.id}>
                                    <Card
                                        sx={{
                                            borderRadius: 3,
                                            height: '100%',
                                            cursor: 'pointer',
                                            transition: '0.25s',
                                            boxShadow: '0 8px 24px rgba(15,23,42,.08)',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: 5,
                                            },
                                        }}
                                        onClick={() => navigate(`/tours/${tour.slug}`)}
                                    >
                                        <Box position="relative">
                                            <CardMedia
                                                component="img"
                                                height="160"
                                                image={getTourImage(tour)}
                                                alt={tour.name}
                                            />

                                            <Chip
                                                label="Giá tốt"
                                                size="small"
                                                color="success"
                                                sx={{
                                                    position: 'absolute',
                                                    top: 12,
                                                    left: 12,
                                                    fontWeight: 800,
                                                }}
                                            />

                                            {hasDiscount(tour) && (
                                                <Chip
                                                    label={`-${tour.discountPercent}%`}
                                                    size="small"
                                                    color="error"
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 12,
                                                        right: 12,
                                                        fontWeight: 800,
                                                    }}
                                                />
                                            )}
                                        </Box>

                                        <CardContent>
                                            <Stack spacing={1.3}>
                                                <Typography fontWeight={800} minHeight={48}>
                                                    {tour.name}
                                                </Typography>

                                                <Typography variant="body2" color="text.secondary">
                                                    {getTourDuration(tour)}
                                                </Typography>

                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <LocationOnIcon fontSize="small" color="primary" />
                                                    <Typography variant="body2" color="text.secondary">
                                                        {tour.defaultPackageName || 'Gói tour ưu đãi'}
                                                    </Typography>
                                                </Stack>

                                                <Box>
                                                    {hasDiscount(tour) && (
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{ textDecoration: 'line-through' }}
                                                        >
                                                            {formatCurrency(getOriginalPrice(tour))}
                                                        </Typography>
                                                    )}

                                                    <Typography variant="h6" color="error" fontWeight={900}>
                                                        {formatCurrency(getDisplayPrice(tour))}
                                                    </Typography>

                                                    {hasDiscount(tour) ? (
                                                        <Typography variant="caption" color="success.main">
                                                            Tiết kiệm {formatCurrency(getSavedAmount(tour))}
                                                        </Typography>
                                                    ) : (
                                                        <Typography variant="caption" color="success.main">
                                                            Ưu đãi tốt trong hôm nay
                                                        </Typography>
                                                    )}
                                                </Box>

                                                <Button
                                                    variant="contained"
                                                    fullWidth
                                                    endIcon={<ArrowForwardIcon />}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        navigate(`/tours/${tour.slug}`);
                                                    }}
                                                >
                                                    Xem tour
                                                </Button>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}

                    <Box textAlign="center" mt={4}>
                        <Button
                            variant="outlined"
                            size="large"
                            endIcon={<ArrowForwardIcon />}
                            sx={{ borderRadius: 99, px: 5 }}
                            onClick={() => navigate('/tours?isHotDeal=true')}
                        >
                            Xem tất cả combo
                        </Button>
                    </Box>
                </Container>
            </Box>

            {/* FAVORITE DESTINATIONS */}
            <Box py={7}>
                <Container maxWidth="lg">
                    <SectionTitle
                        title="Điểm đến yêu thích"
                        subtitle="Khám phá những vùng đất tuyệt đẹp trong và ngoài nước"
                    />

                    <Stack
                        direction="row"
                        spacing={1.5}
                        justifyContent="center"
                        flexWrap="wrap"
                        mb={4}
                        useFlexGap
                    >
                        {destinationTabs.map((tab) => {
                            const active = selectedDestinationTab.label === tab.label;

                            return (
                                <Chip
                                    key={tab.label}
                                    label={tab.label}
                                    color={active ? 'primary' : 'default'}
                                    variant={active ? 'filled' : 'outlined'}
                                    onClick={() => setSelectedDestinationTab(tab)}
                                    sx={{
                                        px: 2,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                    }}
                                />
                            );
                        })}
                    </Stack>

                    {destinationLoading ? (
                        <Stack alignItems="center" justifyContent="center" py={6}>
                            <CircularProgress />
                            <Typography mt={2} color="text.secondary">
                                Đang tải điểm đến...
                            </Typography>
                        </Stack>
                    ) : destinations.length === 0 ? (
                        <Box
                            sx={{
                                py: 6,
                                textAlign: 'center',
                                bgcolor: '#f8fafc',
                                borderRadius: 4,
                            }}
                        >
                            <Typography fontWeight={800} color="text.secondary">
                                Chưa có điểm đến phù hợp
                            </Typography>
                            <Typography fontSize={14} color="text.secondary" mt={1}>
                                Vui lòng chọn nhóm điểm đến khác.
                            </Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={2}>
                            {destinations.map((destination, index) => {
                                const layout = getDestinationGridStyle(index);
                                const image =
                                    destination.defaultImageUrl || fallbackTourImage;

                                return (
                                    <Grid
                                        size={layout.gridSize}
                                        key={destination.id}
                                    >
                                        <DestinationBox
                                            name={destination.name}
                                            // country={destination.country}
                                            {...(destination.country ? { country: destination.country } : {})}
                                            image={image}
                                            height={layout.height}
                                            onClick={() => handleDestinationClick(destination)}
                                        />
                                    </Grid>
                                );
                            })}
                        </Grid>
                    )}
                </Container>
            </Box>
            {/* TESTIMONIALS */}
            <Box py={7} sx={{ bgcolor: '#f8fafc' }}>
                <Container maxWidth="lg">
                    <SectionTitle title="Khách hàng nói gì về chúng tôi" />
                    <Grid container spacing={3}>
                        {testimonials.map((item) => (
                            <Grid size={{ xs: 12, md: 4 }} key={item.name}>
                                <Card sx={{ borderRadius: 4, height: '100%' }}>
                                    <CardContent>
                                        <Stack direction="row" spacing={0.5} mb={2}>
                                            {[1, 2, 3, 4, 5].map((s) => <StarIcon key={s} sx={{ color: '#fbbf24', fontSize: 20 }} />)}
                                        </Stack>
                                        <Typography color="text.secondary" fontStyle="italic" fontSize={15}>
                                            "{item.content}"
                                        </Typography>
                                        <Stack direction="row" spacing={2} alignItems="center" mt={3}>
                                            <Box component="img" src={item.avatar} alt={item.name}
                                                sx={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover' }} />
                                            <Box>
                                                <Typography fontWeight={800}>{item.name}</Typography>
                                                <Typography fontSize={13} color="text.secondary">{item.city}</Typography>
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                    {/* Pagination dots */}
                    <Stack direction="row" spacing={1} justifyContent="center" mt={3}>
                        {[0, 1, 2].map((i) => (
                            <Box key={i} sx={{ width: i === 0 ? 24 : 8, height: 8, borderRadius: 99, bgcolor: i === 0 ? 'primary.main' : '#d1d5db' }} />
                        ))}
                    </Stack>
                </Container>
            </Box>

            {/* NEWSLETTER */}
            
        </Box>
    );
};

// Reusable destination box component
const DestinationBox = ({
    name,
    country,
    image,
    height,
    onClick,
}: {
    name: string;
    country?: string;
    image: string;
    height: number;
    onClick?: () => void;
}) => (
    <Box
        onClick={onClick}
        sx={{
            height,
            borderRadius: 3,
            overflow: 'hidden',
            position: 'relative',
            backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.04), rgba(0,0,0,.62)), url(${image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            cursor: 'pointer',
            transition: '.25s',
            '&:hover': {
                transform: 'scale(1.015)',
                boxShadow: '0 18px 40px rgba(15,23,42,.18)',
            },
        }}
    >
        <Stack
            spacing={0.5}
            sx={{
                position: 'absolute',
                left: 16,
                bottom: 16,
                color: '#fff',
            }}
        >
            <Stack direction="row" spacing={0.8} alignItems="center">
                <LocationOnIcon fontSize="small" />
                <Typography fontWeight={900} fontSize={17}>
                    {name}
                </Typography>
            </Stack>

            {country ? (
                <Typography fontSize={13} color="rgba(255,255,255,.82)" ml={3.2}>
                    {country}
                </Typography>
            ) : null}
        </Stack>
    </Box>
);

export default HomePage;