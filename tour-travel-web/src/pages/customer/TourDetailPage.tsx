import { ReactNode, useEffect, useMemo, useState } from 'react';
import {
    Alert,
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
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography,
    IconButton,
    Fade,
    Collapse,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useNavigate, useParams } from 'react-router-dom';
import tourPublicService from '../../services/public/tourPublicService';
import bookingService from '../../services/public/bookingService';
import { DepartureOption } from '../../types/departure-option';
import { TourDeparture } from '../../types/tour-departure';
import { TourPackage } from '../../types/tour-package';
import { Tour } from '../../types/tour';
import { Booking, CreateBookingPayload } from '../../types/booking';
import { useDepartureSocket } from '../../hooks/useDepartureSocket';
import { socket } from '../../socket';
import OpenStreetMapBox from '../../components/maps/OpenStreetMapBox';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PublicIcon from '@mui/icons-material/Public';
import ImageIcon from '@mui/icons-material/Image';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import CloseIcon from '@mui/icons-material/Close';
import AirportShuttleIcon from '@mui/icons-material/AirportShuttle';
import FlightIcon from '@mui/icons-material/Flight';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DescriptionIcon from '@mui/icons-material/Description';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EventNoteIcon from '@mui/icons-material/EventNote';
import RuleIcon from '@mui/icons-material/Rule';

/* ─── helpers ─────────────────────────────────────────────── */
const formatCurrency = (value: number) =>
    value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

const formatDateTime = (value?: string) => {
    if (!value) return 'Chưa cập nhật';
    return new Date(value).toLocaleString('vi-VN');
};

const formatDateShort = (value?: string) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const transportLabels: Record<string, string> = {
    bus: 'Xe du lịch',
    limousine: 'Limousine',
    flight: 'Máy bay',
    self_arrival: 'Tự túc',
};

const transportIcons: Record<string, ReactNode> = {
    bus: <DirectionsBusIcon fontSize="small" />,
    limousine: <AirportShuttleIcon fontSize="small" />,
    flight: <FlightIcon fontSize="small" />,
    self_arrival: <DirectionsWalkIcon fontSize="small" />,
};

function getCurrentUser() {
    try {
        const raw = localStorage.getItem('currentUser');
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

const parseTourItinerary = (text?: string | null) => {
    if (!text) return [];

    const matches = [
        ...text.matchAll(
            /Ngày\s+(\d+)\s*:\s*([\s\S]*?)(?=Ngày\s+\d+\s*:|$)/gi,
        ),
    ];

    return matches
        .map((match) => {
            const dayText = match[1];
            const contentText = match[2];

            if (!dayText || !contentText) return null;

            return {
                day: Number(dayText),
                content: contentText.trim(),
            };
        })
        .filter(
            (item): item is { day: number; content: string } =>
                item !== null,
        );
};

/* ─── inline styles / tokens ──────────────────────────────── */
const GOLD = '#C9A84C';
const DARK = '#0F172A';
const SURFACE = '#FFFFFF';
const MUTED = '#64748B';

const sectionTitle = {
    fontFamily: '"Playfair Display", Georgia, serif',
    fontWeight: 700,
    color: DARK,
    fontSize: '1.25rem',
    mb: 1.5,
};

const tag = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.5,
    px: 1.5,
    py: 0.5,
    borderRadius: '999px',
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
};

/* ══════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════ */
export default function TourDetailPage() {
    const { slug } = useParams();
    const navigate = useNavigate();

    const [detail, setDetail] = useState<Tour | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [savedMessage, setSavedMessage] = useState('');

    const [selectedPackageId, setSelectedPackageId] = useState<string>('');
    const [selectedDepartureId, setSelectedDepartureId] = useState<string>('');
    const [selectedOptionId, setSelectedOptionId] = useState<string>('');
    const [isPrivateGuide, setIsPrivateGuide] = useState(false);

    const [adultCount, setAdultCount] = useState<number>(1);
    const [childCount, setChildCount] = useState<number>(0);

    const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
    const [bookingSubmitting, setBookingSubmitting] = useState(false);

    const [contactName, setContactName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [notes, setNotes] = useState('');

    /* gallery */
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const [departureBookings, setDepartureBookings] = useState<Booking[]>([]);

    useDepartureSocket(Number(selectedDepartureId));
    useDepartureSocket(Number(selectedDepartureId), (payload) => {
        if (selectedDepartureId) {
            fetchUserDepartureBookings(Number(selectedDepartureId));
        }
    });

    const fetchUserDepartureBookings = async (departureId: number) => {
        try {
            setLoading(true);
            const bookings = await bookingService.getPaymentsByBooking(departureId);

        } catch (err: any) {
            setError(err?.message || 'Không tải được bookings');
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        const onSlotsUpdated = (payload: any) => {
            console.log('departure.slots_updated', payload);

            // bước đầu: chỉ log
            // bước sau: gọi lại API departure/tour detail
        };

        socket.on('departure.slots_updated', onSlotsUpdated);

        return () => {
            socket.off('departure.slots_updated', onSlotsUpdated);
        };
    }, []);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                setLoading(true);
                setError('');
                const data = await tourPublicService.getBySlug(String(slug));
                console.log("detail :", data);
                setDetail(data);

                const defaultPackage = data.packages?.find((x) => x.isDefault) || data.packages?.[0];
                const defaultDeparture = data.departures?.[0];
                const defaultOption = defaultDeparture?.options?.[0];

                setSelectedPackageId(defaultPackage?.id != null ? String(defaultPackage.id) : '');
                setSelectedDepartureId(defaultDeparture?.id != null ? String(defaultDeparture.id) : '');
                setSelectedOptionId(defaultOption?.id != null ? String(defaultOption.id) : '');
            } catch (err: any) {
                setError(err?.response?.data?.message || 'Không tải được chi tiết tour');
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [slug]);

    const selectedPackage = useMemo<TourPackage | undefined>(
        () => detail?.packages?.find((x) => String(x.id) === selectedPackageId),
        [detail, selectedPackageId],
    );
    const selectedDeparture = useMemo<TourDeparture | undefined>(
        () => detail?.departures?.find((x) => String(x.id) === selectedDepartureId),
        [detail, selectedDepartureId],
    );
    const selectedOption = useMemo<DepartureOption | undefined>(
        () => selectedDeparture?.options?.find((x) => String(x.id) === selectedOptionId),
        [selectedDeparture, selectedOptionId],
    );

    useEffect(() => {
        if (!selectedDeparture) { setSelectedOptionId(''); return; }
        const firstOption = selectedDeparture.options?.[0];
        setSelectedOptionId(firstOption?.id != null ? String(firstOption.id) : '');
    }, [selectedDepartureId, selectedDeparture]);

    useEffect(() => {
        if (!selectedPackage?.allowGuideOption) setIsPrivateGuide(false);
    }, [selectedPackage?.allowGuideOption]);

    const adultUnitPrice = Number(selectedPackage?.priceAdult ?? 0);
    const childUnitPrice = Number(selectedPackage?.priceChild ?? 0);
    const departureAdjustment = Number(selectedDeparture?.basePriceAdjustment ?? 0);
    const optionExtra = Number(selectedOption?.extraPrice ?? 0);
    const guideExtra = isPrivateGuide && selectedPackage?.allowGuideOption
        ? Number(selectedPackage?.guideExtraPrice ?? 0) : 0;
    const total =
        adultCount * (adultUnitPrice + departureAdjustment + optionExtra) +
        childCount * (childUnitPrice + departureAdjustment + optionExtra) +
        guideExtra;

    const handleSaveSelection = () => {
        if (!detail || !selectedPackage || !selectedDeparture || !selectedOption) return;
        const payload = {
            tourId: detail.id, slug: detail.slug,
            packageId: selectedPackage.id, departureId: selectedDeparture.id,
            optionId: selectedOption.id, isPrivateGuide, adultCount, childCount, total,
        };
        sessionStorage.setItem('tour-booking-preview', JSON.stringify(payload));
        setSavedMessage('Đã lưu cấu hình tour của bạn.');
    };

    const handleOpenBookingDialog = () => {
        if (!detail || !selectedPackage || !selectedDeparture || !selectedOption) {
            setError('Vui lòng chọn đầy đủ gói tour, đợt khởi hành và điểm đi.');
            return;
        }
        const currentUser = getCurrentUser();
        if (!currentUser) { navigate('/auth/login'); return; }
        setContactName(currentUser.name || '');
        setContactEmail(currentUser.email || '');
        setContactPhone(currentUser.phone || '');
        setNotes('');
        setBookingDialogOpen(true);
    };

    const handleCreateBooking = async () => {
        if (!detail || !selectedPackage || !selectedDeparture || !selectedOption) return;
        if (!contactName.trim()) { setError('Vui lòng nhập họ tên liên hệ.'); return; }
        if (!contactEmail.trim()) { setError('Vui lòng nhập email liên hệ.'); return; }
        try {
            setBookingSubmitting(true);
            setError('');
            const payload: CreateBookingPayload = {
                tourId: detail.id, packageId: selectedPackage.id,
                departureId: selectedDeparture.id, optionId: selectedOption.id,
                adultCount, contactName: contactName.trim(), contactEmail: contactEmail.trim(),
            };
            if (childCount > 0) payload.childCount = childCount;
            if (isPrivateGuide) payload.isPrivateGuide = true;
            if (contactPhone.trim()) payload.contactPhone = contactPhone.trim();
            if (notes.trim()) payload.notes = notes.trim();
            const booking = await bookingService.create(payload);
            setBookingDialogOpen(false);
            navigate(`/my-bookings/${booking.id}`);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Không tạo được booking');
        } finally {
            setBookingSubmitting(false);
        }
    };

    /* ── loading / error states ── */
    if (loading) {
        return (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={16} gap={2}>
                <CircularProgress sx={{ color: GOLD }} />
                <Typography color={MUTED} fontSize="0.9rem">Đang tải thông tin tour…</Typography>
            </Box>
        );
    }
    if (error && !detail) return <Alert severity="error">{error}</Alert>;
    if (!detail) return <Alert severity="warning">Không tìm thấy tour.</Alert>;
    const itineraryItems = parseTourItinerary(detail.includedServices);

    const packages = detail.packages || [];
    const departures = detail.departures || [];
    const options = selectedDeparture?.options || [];

    /* ── gallery images (coverImageUrl + images array if exists) ── */
    const allImages: string[] = [
        // ...(detail.coverImageUrl ? [detail.coverImageUrl] : []),
        ...((detail as any).images?.map((img: any) => img.url || img) ?? []),
    ].filter(Boolean);

    /* ══════════════════════════════════════════════════════════
       RENDER
    ══════════════════════════════════════════════════════════ */
    return (
        <Box sx={{ fontFamily: '"DM Sans", sans-serif', bgcolor: '#F8F7F4', minHeight: '100vh' }}>
            {/* Google Fonts */}
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>

            {/* ── HERO ───────────────────────────────────────────── */}
            <Box
                sx={{
                    position: 'relative',
                    height: { xs: 480, md: 300 },
                    overflow: 'hidden',
                    cursor: allImages.length > 0 ? 'pointer' : 'default',
                }}
                onClick={() => allImages.length > 0 && (setLightboxIndex(0), setLightboxOpen(true))}
            >
                {/* background */}
                <Box
                    sx={{
                        position: 'absolute', inset: 0,
                        backgroundImage:
                            'linear-gradient(135deg, #0F172A 0%, #1e3a5f 60%, #0f4c75 100%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        transition: 'transform 8s ease',
                        '&:hover': { transform: 'scale(1.04)' },
                    }}
                />
                {/* gradient overlay */}
                <Box sx={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.35) 50%, rgba(15,23,42,0.1) 100%)',
                }} />

                {/* thumbnail strip (top-right) */}
                {allImages.length > 1 && (
                    <Box sx={{
                        position: 'absolute', top: 20, right: 20,
                        display: 'flex', gap: 1, zIndex: 2,
                    }}>
                        {allImages.slice(1, 4).map((src, i) => (
                            <Box
                                key={i}
                                onClick={(e) => { e.stopPropagation(); setLightboxIndex(i + 1); setLightboxOpen(true); }}
                                sx={{
                                    width: 72, height: 54, borderRadius: 2,
                                    backgroundImage: `url(${src})`,
                                    backgroundSize: 'cover', backgroundPosition: 'center',
                                    border: '2px solid rgba(255,255,255,0.4)',
                                    cursor: 'pointer',
                                    transition: 'all .2s',
                                    '&:hover': { borderColor: GOLD, transform: 'scale(1.06)' },
                                }}
                            />
                        ))}
                        {allImages.length > 4 && (
                            <Box sx={{
                                width: 72, height: 54, borderRadius: 2,
                                bgcolor: 'rgba(0,0,0,0.55)',
                                border: '2px solid rgba(255,255,255,0.4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: '#fff', fontSize: '0.8rem', fontWeight: 700,
                            }}
                                onClick={(e) => { e.stopPropagation(); setLightboxIndex(4); setLightboxOpen(true); }}
                            >
                                +{allImages.length - 4}
                            </Box>
                        )}
                    </Box>
                )}

                {/* "Xem ảnh" badge if only 1 image */}
                {allImages.length === 1 && (
                    <Box sx={{
                        position: 'absolute', top: 20, right: 20, zIndex: 2,
                        bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', borderRadius: 2,
                        px: 1.5, py: 0.75, fontSize: '0.8rem', fontWeight: 600,
                        backdropFilter: 'blur(6px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                    }}>
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                            <ImageIcon fontSize="small" />
                            <span>Xem ảnh lớn</span>
                        </Stack>
                    </Box>
                )}

                {/* hero content */}
                <Box sx={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    p: { xs: 3, md: 5 },
                }}>
                    {/* chips */}
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={2}>
                        <Box sx={{ ...tag, bgcolor: GOLD, color: '#fff' }}>
                            <AccessTimeIcon sx={{ fontSize: 16 }} />
                            {detail.durationDays} ngày {detail.durationNights} đêm
                        </Box>
                        <Box sx={{ ...tag, bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', backdropFilter: 'blur(6px)' }}>
                            <Inventory2Icon sx={{ fontSize: 16 }} />
                            {packages.length} gói
                        </Box>
                        <Box sx={{ ...tag, bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', backdropFilter: 'blur(6px)' }}>
                            <CalendarMonthIcon sx={{ fontSize: 16 }} />
                            {departures.length} đợt
                        </Box>
                    </Stack>

                    <Typography sx={{
                        fontFamily: '"Playfair Display", serif',
                        fontWeight: 800,
                        fontSize: { xs: '2rem', md: '3rem' },
                        color: '#fff',
                        lineHeight: 1.15,
                        textShadow: '0 2px 12px rgba(0,0,0,0.4)',
                        maxWidth: 720,
                    }}>
                        {detail.name}
                    </Typography>

                    {detail.shortDescription && (
                        <Typography sx={{
                            color: 'rgba(255,255,255,0.82)',
                            mt: 1.5, maxWidth: 600,
                            fontSize: '1rem', lineHeight: 1.65,
                        }}>
                            {detail.shortDescription}
                        </Typography>
                    )}
                </Box>
            </Box>

            {/* ── BODY ───────────────────────────────────────────── */}
            <Box sx={{ maxWidth: 1280, mx: 'auto', px: { xs: 2, md: 4 }, py: 5 }}>

                {savedMessage && (
                    <Fade in>
                        <Alert
                            severity="success"
                            onClose={() => setSavedMessage('')}
                            sx={{ mb: 3, borderRadius: 3, fontFamily: '"DM Sans", sans-serif' }}
                        >
                            {savedMessage}
                        </Alert>
                    </Fade>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={4} alignItems="flex-start">
                    {/* ── LEFT COLUMN ───────────────────────────── */}
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Stack spacing={3}>

                            {/* Image gallery strip */}
                            {allImages.length > 1 && (
                                <Box>
                                    <Typography sx={{ ...sectionTitle, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ImageIcon fontSize="small" />
                                        Hình ảnh tour
                                    </Typography>
                                    <Box sx={{
                                        display: 'grid',
                                        gridTemplateColumns: allImages.length === 2
                                            ? '1fr 1fr'
                                            : allImages.length === 3
                                                ? '2fr 1fr 1fr'
                                                : '2fr 1fr 1fr',
                                        gridTemplateRows: 'auto',
                                        gap: 1.5,
                                        borderRadius: 4,
                                        overflow: 'hidden',
                                    }}>
                                        {allImages.slice(0, 4).map((src, i) => (
                                            <Box
                                                key={i}
                                                onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
                                                sx={{
                                                    gridColumn: i === 0 && allImages.length >= 3 ? 'span 1' : 'span 1',
                                                    gridRow: i === 0 && allImages.length >= 3 ? 'span 2' : 'span 1',
                                                    height: i === 0 ? { xs: 200, md: 280 } : { xs: 130, md: 130 },
                                                    backgroundImage: `url(${src})`,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    borderRadius: 3,
                                                    cursor: 'pointer',
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                    transition: 'all .25s',
                                                    '&:hover': { transform: 'scale(1.025)', zIndex: 1 },
                                                    '&:hover::after': {
                                                        opacity: 1,
                                                    },
                                                    '&::after': {
                                                        content: '""', position: 'absolute', inset: 0,
                                                        bgcolor: 'rgba(201,168,76,0.25)',
                                                        opacity: 0, transition: 'opacity .25s',
                                                    },
                                                }}
                                            >
                                                {i === 3 && allImages.length > 4 && (
                                                    <Box sx={{
                                                        position: 'absolute', inset: 0,
                                                        bgcolor: 'rgba(0,0,0,0.55)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: '#fff', fontSize: '1.4rem', fontWeight: 800,
                                                    }}>
                                                        +{allImages.length - 4}
                                                    </Box>
                                                )}
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            )}

                            {/* Description */}
                            {detail.description && (
                                <InfoCard title={
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <DescriptionIcon fontSize="small" sx={{ color: '#2563eb' }} />
                                        <span>Mô tả tour</span>
                                    </Stack>
                                }>
                                    <Typography whiteSpace="pre-line" color={MUTED} lineHeight={1.8}>
                                        {detail.description}
                                    </Typography>
                                </InfoCard>
                            )}

                            {/* Highlights */}
                            {detail.highlights && (
                                <InfoCard title={
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <AutoAwesomeIcon fontSize="small" sx={{ color: '#c9a84c' }} />
                                        <span>Điểm nổi bật</span>
                                    </Stack>
                                }>
                                    <Typography whiteSpace="pre-line" color={MUTED} lineHeight={1.8}>
                                        {detail.highlights}
                                    </Typography>
                                </InfoCard>
                            )}


                            <InfoCard
                                title={
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <EventNoteIcon fontSize="small" sx={{ color: '#16a34a' }} />
                                        <span>Lịch trình tour</span>
                                    </Stack>
                                }
                                accentColor="#16a34a"
                            >
                                <Box mt={4}>

                                    {itineraryItems.length > 0 ? (
                                        <Stack spacing={2}>
                                            {itineraryItems.map((item) => (
                                                <Paper
                                                    key={item.day}
                                                    variant="outlined"
                                                    sx={{
                                                        p: 2.5,
                                                        borderRadius: 3,
                                                    }}
                                                >
                                                    <Stack direction="row" spacing={2} alignItems="flex-start">
                                                        <Box
                                                            sx={{
                                                                minWidth: 64,
                                                                height: 64,
                                                                borderRadius: "50%",
                                                                bgcolor: "primary.main",
                                                                color: "#fff",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                flexDirection: "column",
                                                                fontWeight: 800,
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            <Typography fontSize={12} lineHeight={1}>
                                                                Ngày
                                                            </Typography>
                                                            <Typography fontSize={22} fontWeight={900} lineHeight={1.1}>
                                                                {item.day}
                                                            </Typography>
                                                        </Box>

                                                        <Box>

                                                            <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
                                                                {item.content}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                </Paper>
                                            ))}
                                        </Stack>
                                    ) : (
                                        <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
                                            {detail.includedServices || "Chưa cập nhật lịch trình"}
                                        </Typography>
                                    )}
                                </Box>
                            </InfoCard>





                            {/* Included / Excluded
                            {(detail.includedServices || detail.excludedServices) && (
                                <Grid container >
                                    {detail.includedServices && (
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <InfoCard title="✅ Dịch vụ bao gồm" accentColor="#16a34a">
                                                <Typography whiteSpace="pre-line" color={MUTED} lineHeight={1.8} fontSize="0.9rem">
                                                    {detail.includedServices}
                                                </Typography>
                                            </InfoCard>
                                        </Grid>
                                    )}
                                    {detail.excludedServices && (
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <InfoCard title="❌ Không bao gồm" accentColor="#dc2626">
                                                <Typography whiteSpace="pre-line" color={MUTED} lineHeight={1.8} fontSize="0.9rem">
                                                    {detail.excludedServices}
                                                </Typography>
                                            </InfoCard>
                                        </Grid>
                                    )}
                                </Grid>
                            )} */}

                            {/* Terms */}
                            {detail.termsAndConditions && (
                                <InfoCard title={
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <RuleIcon fontSize="small" sx={{ color: '#d97706' }} />
                                        <span>Điều khoản áp dụng</span>
                                    </Stack>
                                }>
                                    <Typography whiteSpace="pre-line" color={MUTED} lineHeight={1.8} fontSize="0.9rem">
                                        {detail.termsAndConditions}
                                    </Typography>
                                </InfoCard>
                            )}


                        </Stack>
                    </Grid>

                    {/* ── RIGHT COLUMN (sticky) ─────────────────── */}
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Stack spacing={3} sx={{ position: { md: 'sticky' }, top: 24 }}>

                            {/* BOOKING CARD */}
                            <Box sx={{
                                bgcolor: SURFACE,
                                borderRadius: 4,
                                overflow: 'hidden',
                                boxShadow: '0 4px 32px rgba(0,0,0,0.10)',
                                border: '1px solid rgba(0,0,0,0.06)',
                            }}>
                                {/* card header */}
                                <Box sx={{
                                    background: `linear-gradient(135deg, ${DARK} 0%, #1e3a5f 100%)`,
                                    px: 3, py: 2.5,
                                }}>
                                    <Typography sx={{
                                        fontFamily: '"Playfair Display", serif',
                                        color: '#fff', fontWeight: 700, fontSize: '1.1rem',
                                    }}>
                                        Cấu hình chuyến đi
                                    </Typography>
                                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', mt: 0.25 }}>
                                        Chọn gói phù hợp với nhu cầu của bạn
                                    </Typography>
                                </Box>

                                <Box sx={{ p: 3 }}>
                                    <Stack spacing={2.5}>
                                        {/* Package */}
                                        <StyledSelect
                                            label="📦 Gói tour"
                                            value={selectedPackageId}
                                            onChange={(v) => setSelectedPackageId(v)}
                                        >
                                            {packages.map((item) => (
                                                <MenuItem key={item.id} value={String(item.id)}>
                                                    <Box>
                                                        <Typography fontSize="0.9rem" fontWeight={600}>{item.name}</Typography>
                                                        <Typography fontSize="0.78rem" color={MUTED}>
                                                            từ {formatCurrency(Number(item.priceAdult))} / người
                                                        </Typography>
                                                    </Box>
                                                </MenuItem>
                                            ))}
                                        </StyledSelect>

                                        {/* Departure */}
                                        <StyledSelect
                                            label="🗓 Đợt khởi hành"
                                            value={selectedDepartureId}
                                            onChange={(v) => setSelectedDepartureId(v)}
                                        >
                                            {departures.map((item) => (
                                                <MenuItem key={item.id} value={String(item.id)}>
                                                    <Box>
                                                        <Typography fontSize="0.9rem" fontWeight={600}>{item.code}</Typography>
                                                        <Typography fontSize="0.78rem" color={MUTED}>
                                                            {formatDateShort(item.departureDate)} · còn {item.availableSlots ?? 0} chỗ
                                                        </Typography>
                                                    </Box>
                                                </MenuItem>
                                            ))}
                                        </StyledSelect>

                                        {/* Option */}
                                        <StyledSelect
                                            label="🚀 Điểm đi / Phương tiện"
                                            value={selectedOptionId}
                                            onChange={(v) => setSelectedOptionId(v)}
                                            disabled={options.length === 0}
                                        >
                                            {options.map((item) => (
                                                <MenuItem key={item.id} value={String(item.id)}>
                                                    <Box>
                                                        <Typography fontSize="0.9rem" fontWeight={600}>
                                                            {transportIcons[item.transportType] || '🚌'} {item.departureCity} — {transportLabels[item.transportType] || item.transportType}
                                                        </Typography>
                                                        <Typography fontSize="0.78rem" color={MUTED}>
                                                            Phụ thu: {formatCurrency(Number(item.extraPrice))}
                                                        </Typography>
                                                    </Box>
                                                </MenuItem>
                                            ))}
                                        </StyledSelect>

                                        {/* Pax */}
                                        <Grid container spacing={2}>
                                            <Grid size={6}>
                                                <TextField
                                                    type="number"
                                                    label="👤 Người lớn"
                                                    value={adultCount}
                                                    onChange={(e) => setAdultCount(Math.max(1, Number(e.target.value) || 1))}
                                                    fullWidth
                                                    size="small"
                                                    inputProps={{ min: 1 }}
                                                    sx={selectSx}
                                                />
                                            </Grid>
                                            <Grid size={6}>
                                                <TextField
                                                    type="number"
                                                    label="🧒 Trẻ em"
                                                    value={childCount}
                                                    onChange={(e) => setChildCount(Math.max(0, Number(e.target.value) || 0))}
                                                    fullWidth
                                                    size="small"
                                                    inputProps={{ min: 0 }}
                                                    sx={selectSx}
                                                />
                                            </Grid>
                                        </Grid>

                                        {/* Private guide toggle */}
                                        {selectedPackage?.allowGuideOption && (
                                            <Box
                                                onClick={() => setIsPrivateGuide((p) => !p)}
                                                sx={{
                                                    display: 'flex', alignItems: 'center', gap: 2,
                                                    p: 2, borderRadius: 3, cursor: 'pointer',
                                                    border: `2px solid ${isPrivateGuide ? GOLD : 'rgba(0,0,0,0.1)'}`,
                                                    bgcolor: isPrivateGuide ? 'rgba(201,168,76,0.08)' : 'transparent',
                                                    transition: 'all .2s',
                                                    '&:hover': { borderColor: GOLD },
                                                }}
                                            >
                                                <Typography fontSize="1.5rem">🧑‍✈️</Typography>
                                                <Box flex={1}>
                                                    <Typography fontWeight={600} fontSize="0.9rem">
                                                        Hướng dẫn viên riêng
                                                    </Typography>
                                                    <Typography fontSize="0.78rem" color={MUTED}>
                                                        +{formatCurrency(Number(selectedPackage?.guideExtraPrice ?? 0))}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{
                                                    width: 40, height: 22, borderRadius: '999px',
                                                    bgcolor: isPrivateGuide ? GOLD : 'rgba(0,0,0,0.15)',
                                                    position: 'relative', transition: 'all .2s',
                                                }}>
                                                    <Box sx={{
                                                        position: 'absolute', top: 3,
                                                        left: isPrivateGuide ? 21 : 3,
                                                        width: 16, height: 16, borderRadius: '50%',
                                                        bgcolor: '#fff', transition: 'left .2s',
                                                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                                                    }} />
                                                </Box>
                                            </Box>
                                        )}
                                    </Stack>
                                </Box>
                            </Box>

                            {/* PRICE SUMMARY */}
                            <Box sx={{
                                bgcolor: SURFACE,
                                borderRadius: 4,
                                overflow: 'hidden',
                                boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
                                border: '1px solid rgba(0,0,0,0.06)',
                            }}>
                                <Box sx={{ px: 3, pt: 3, pb: 1 }}>
                                    <Typography sx={{ ...sectionTitle, mb: 2 }}>💰 Tạm tính</Typography>

                                    <Stack spacing={1.25}>
                                        <PriceRow label={`Người lớn × ${adultCount}`} value={adultUnitPrice * adultCount} />
                                        {childCount > 0 && <PriceRow label={`Trẻ em × ${childCount}`} value={childUnitPrice * childCount} />}
                                        {departureAdjustment !== 0 && <PriceRow label="Điều chỉnh đợt đi" value={(adultCount + childCount) * departureAdjustment} />}
                                        {optionExtra > 0 && <PriceRow label="Phụ thu điểm đi" value={(adultCount + childCount) * optionExtra} />}
                                        {guideExtra > 0 && <PriceRow label="Hướng dẫn viên riêng" value={guideExtra} accent />}
                                    </Stack>
                                </Box>

                                <Box sx={{ mx: 3, my: 1.5 }}>
                                    <Divider sx={{ borderStyle: 'dashed' }} />
                                </Box>

                                <Box sx={{ px: 3, pb: 3 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                                        <Typography fontWeight={700} fontSize="0.95rem">Tổng cộng</Typography>
                                        <Typography sx={{
                                            fontFamily: '"Playfair Display", serif',
                                            fontSize: '1.5rem',
                                            fontWeight: 800,
                                            color: GOLD,
                                        }}>
                                            {formatCurrency(total)}
                                        </Typography>
                                    </Stack>

                                    <Stack spacing={1.5}>
                                        <Button
                                            variant="outlined"
                                            fullWidth
                                            onClick={handleSaveSelection}
                                            disabled={!selectedPackage || !selectedDeparture || !selectedOption}
                                            sx={{
                                                borderColor: DARK, color: DARK,
                                                borderRadius: 3, py: 1.25,
                                                fontWeight: 600, fontSize: '0.9rem',
                                                '&:hover': { bgcolor: DARK, color: '#fff', borderColor: DARK },
                                            }}
                                        >
                                            Lưu lựa chọn
                                        </Button>
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            onClick={handleOpenBookingDialog}
                                            disabled={!selectedPackage || !selectedDeparture || !selectedOption}
                                            sx={{
                                                bgcolor: GOLD,
                                                '&:hover': { bgcolor: '#b8962e' },
                                                borderRadius: 3, py: 1.5,
                                                fontFamily: '"DM Sans", sans-serif',
                                                fontWeight: 700, fontSize: '1rem',
                                                letterSpacing: '0.02em',
                                                boxShadow: `0 4px 20px rgba(201,168,76,0.4)`,
                                            }}
                                        >
                                            ✈️ Đặt tour ngay
                                        </Button>
                                    </Stack>
                                </Box>
                            </Box>

                            {/* SELECTION SUMMARY */}
                            {(selectedPackage || selectedDeparture || selectedOption) && (
                                <Box sx={{
                                    bgcolor: SURFACE,
                                    borderRadius: 4,
                                    p: 3,
                                    boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                                    border: '1px solid rgba(0,0,0,0.06)',
                                }}>
                                    <Typography sx={{ ...sectionTitle, mb: 2 }}>🗂 Chi tiết lựa chọn</Typography>
                                    <Stack spacing={1.25}>
                                        <DetailRow icon="📦" label="Gói" value={selectedPackage?.name || '—'} />
                                        <DetailRow icon="🏨" label="Khách sạn" value={selectedPackage?.hotelName || 'Chưa cập nhật'} />
                                        <DetailRow icon="🛫" label="Khởi hành" value={formatDateShort(selectedDeparture?.departureDate)} />
                                        <DetailRow icon="🛬" label="Kết thúc" value={formatDateShort(selectedDeparture?.returnDate)} />
                                        <DetailRow icon="⏰" label="Hạn đăng ký" value={formatDateShort(selectedDeparture?.registrationDeadline)} />
                                        <DetailRow icon="📍" label="Điểm đi" value={selectedOption?.departureCity || '—'} />
                                        <DetailRow icon="🚌" label="Phương tiện"
                                            value={selectedOption
                                                ? `${transportIcons[selectedOption.transportType] || ''} ${transportLabels[selectedOption.transportType] || selectedOption.transportType}`
                                                : '—'}
                                        />
                                        <DetailRow icon="🪑" label="Còn chỗ" value={selectedDeparture?.availableSlots != null ? `${selectedDeparture.availableSlots} chỗ` : '—'} />
                                    </Stack>
                                </Box>
                            )}
                        </Stack>
                    </Grid>

                </Grid>

                {/* map */}
                {detail.destination && (
                    <Box mt={5}>
                        <Paper
                            variant="outlined"
                            sx={{
                                p: { xs: 2, md: 3 },
                                borderRadius: 4,
                                overflow: 'hidden',
                                bgcolor: '#fff',
                            }}
                        >
                            <Box>
                                <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                                    <LocationOnIcon color="primary" />
                                    <Typography variant="h5" fontWeight={800}>
                                        Điểm đến trong hành trình
                                    </Typography>
                                </Stack>
                                <Stack spacing={2}>
                                    <Stack spacing={1.2}>
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            alignItems="center"
                                            flexWrap="wrap"
                                        >
                                            <PublicIcon fontSize="small" color="primary" />

                                            <Typography variant="h6" fontWeight={800}>
                                                {detail.destination.name}
                                            </Typography>

                                            <Typography color="text.secondary">
                                                - {detail.destination.country || 'Việt Nam'}
                                            </Typography>
                                        </Stack>

                                        {/* <Typography color="text.secondary">
                                                            {detail.destination.mapAddress || detail.destination.name}
                                                        </Typography> */}

                                        {detail.destination.description && (
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: 'text.secondary',
                                                    lineHeight: 1.7,
                                                }}
                                            >
                                                {detail.destination.description}
                                            </Typography>
                                        )}

                                        {detail.destination.latitude && detail.destination.longitude && (
                                            <Typography variant="caption" color="text.secondary">
                                                Tọa độ: {detail.destination.latitude},{' '}
                                                {detail.destination.longitude}
                                            </Typography>
                                        )}
                                    </Stack>

                                    <Box
                                        sx={{
                                            width: '100%',
                                            height: { xs: 280, md: 380 },
                                            borderRadius: 3,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <OpenStreetMapBox
                                            lat={detail.destination.latitude ?? null}
                                            lng={detail.destination.longitude ?? null}
                                            title={detail.destination.name}
                                            address={detail.destination.mapAddress ?? null}
                                            height={380}
                                            zoom={13}
                                        />
                                    </Box>
                                </Stack>
                            </Box>
                        </Paper>
                    </Box>
                )}
            </Box>

            {/* ── LIGHTBOX ───────────────────────────────────────── */}
            <Dialog
                open={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                maxWidth="xl"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: 'rgba(10,15,30,0.97)',
                        borderRadius: 4,
                        overflow: 'hidden',
                    }
                }}
            >
                <Box sx={{ position: 'relative' }}>
                    {/* close */}
                    <IconButton
                        onClick={() => setLightboxOpen(false)}
                        sx={{
                            position: 'absolute', top: 12, right: 12, zIndex: 10,
                            bgcolor: 'rgba(255,255,255,0.1)', color: '#fff',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                        }}
                    >
                        ✕
                    </IconButton>

                    {/* main image */}
                    <Box sx={{
                        width: '100%',
                        height: { xs: 320, md: 560 },
                        backgroundImage: `url(${allImages[lightboxIndex]})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        bgcolor: '#000',
                    }} />

                    {/* nav */}
                    {allImages.length > 1 && (
                        <Box sx={{
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            gap: 2, py: 2,
                        }}>
                            <IconButton
                                disabled={lightboxIndex === 0}
                                onClick={() => setLightboxIndex((i) => i - 1)}
                                sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: GOLD } }}
                            >
                                ◀
                            </IconButton>
                            <Typography color="rgba(255,255,255,0.7)" fontSize="0.9rem">
                                {lightboxIndex + 1} / {allImages.length}
                            </Typography>
                            <IconButton
                                disabled={lightboxIndex === allImages.length - 1}
                                onClick={() => setLightboxIndex((i) => i + 1)}
                                sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: GOLD } }}
                            >
                                ▶
                            </IconButton>
                        </Box>
                    )}

                    {/* thumbnail strip */}
                    {allImages.length > 1 && (
                        <Box sx={{
                            display: 'flex', gap: 1, px: 3, pb: 3,
                            overflowX: 'auto',
                            '&::-webkit-scrollbar': { height: 4 },
                            '&::-webkit-scrollbar-thumb': { bgcolor: GOLD, borderRadius: 2 },
                        }}>
                            {allImages.map((src, i) => (
                                <Box
                                    key={i}
                                    onClick={() => setLightboxIndex(i)}
                                    sx={{
                                        flexShrink: 0,
                                        width: 80, height: 56,
                                        backgroundImage: `url(${src})`,
                                        backgroundSize: 'cover', backgroundPosition: 'center',
                                        borderRadius: 2, cursor: 'pointer',
                                        border: `2px solid ${i === lightboxIndex ? GOLD : 'transparent'}`,
                                        opacity: i === lightboxIndex ? 1 : 0.55,
                                        transition: 'all .2s',
                                        '&:hover': { opacity: 1 },
                                    }}
                                />
                            ))}
                        </Box>
                    )}
                </Box>
            </Dialog>

            {/* ── BOOKING DIALOG ─────────────────────────────────── */}
            <Dialog
                open={bookingDialogOpen}
                onClose={() => setBookingDialogOpen(false)}
                fullWidth maxWidth="sm"
                PaperProps={{ sx: { borderRadius: 4 } }}
            >
                <DialogTitle sx={{
                    fontFamily: '"Playfair Display", serif',
                    fontWeight: 700, fontSize: '1.3rem',
                    borderBottom: '1px solid rgba(0,0,0,0.08)',
                    pb: 2,
                }}>
                    ✈️ Xác nhận đặt tour
                </DialogTitle>

                <DialogContent sx={{ pt: 3 }}>
                    {/* mini summary */}
                    <Box sx={{
                        bgcolor: '#F8F7F4', borderRadius: 3, p: 2, mb: 3,
                        border: '1px solid rgba(0,0,0,0.06)',
                    }}>
                        <Typography fontWeight={700} fontSize="0.9rem" mb={0.75}>{detail?.name}</Typography>
                        <Stack direction="row" flexWrap="wrap" gap={0.75}>
                            {selectedPackage && <Chip label={selectedPackage.name} size="small" />}
                            {selectedDeparture && <Chip label={selectedDeparture.code} size="small" />}
                            <Chip label={`${adultCount} người lớn${childCount > 0 ? `, ${childCount} trẻ em` : ''}`} size="small" />
                            <Chip label={formatCurrency(total)} size="small" sx={{ bgcolor: GOLD, color: '#fff', fontWeight: 700 }} />
                        </Stack>
                    </Box>

                    <Stack spacing={2}>
                        <TextField label="Họ và tên *" value={contactName} onChange={(e) => setContactName(e.target.value)} fullWidth sx={selectSx} />
                        <TextField label="Email *" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} fullWidth sx={selectSx} />
                        <TextField label="Số điện thoại" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} fullWidth sx={selectSx} />
                        <TextField label="Ghi chú" value={notes} onChange={(e) => setNotes(e.target.value)} fullWidth multiline minRows={3} sx={selectSx} />
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                    <Button onClick={() => setBookingDialogOpen(false)} sx={{ borderRadius: 3, color: MUTED }}>
                        Huỷ
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateBooking}
                        disabled={bookingSubmitting}
                        sx={{
                            bgcolor: GOLD, '&:hover': { bgcolor: '#b8962e' },
                            borderRadius: 3, px: 4, fontWeight: 700,
                        }}
                    >
                        {bookingSubmitting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Xác nhận đặt tour'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

/* ─── Small helper components ──────────────────────────────── */

function InfoCard({
    title,
    children,
    accentColor = GOLD,
}: {
    title: ReactNode;
    children: React.ReactNode;
    accentColor?: string;
}) {
    return (
        <Box sx={{
            bgcolor: SURFACE,
            borderRadius: 4,
            p: 3,
            boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
            border: '1px solid rgba(0,0,0,0.06)',
            borderLeft: `4px solid ${accentColor}`,
        }}>
            <Typography
                component="div"
                sx={{
                    fontFamily: '"Playfair Display", serif',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    color: DARK,
                    mb: 1.5,
                }}
            >
                {title}
            </Typography>

            {children}
        </Box>
    );
}

function PriceRow({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
    return (
        <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography fontSize="0.875rem" color={accent ? DARK : MUTED} fontWeight={accent ? 600 : 400}>
                {label}
            </Typography>
            <Typography fontSize="0.875rem" fontWeight={accent ? 700 : 500} color={accent ? GOLD : DARK}>
                {formatCurrency(value)}
            </Typography>
        </Stack>
    );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <Stack direction="row" alignItems="flex-start" gap={1.5}>
            <Typography fontSize="1rem" lineHeight={1.4}>{icon}</Typography>
            <Box>
                <Typography fontSize="0.78rem" color={MUTED} lineHeight={1}>{label}</Typography>
                <Typography fontSize="0.9rem" fontWeight={500} color={DARK}>{value}</Typography>
            </Box>
        </Stack>
    );
}

const selectSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: 2,
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: GOLD },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: GOLD },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: GOLD },
};

function StyledSelect({ label, value, onChange, children, disabled }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    children: React.ReactNode;
    disabled?: boolean;
}) {
    return (
        <TextField
            select fullWidth size="small"
            label={label} value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            sx={selectSx}
            SelectProps={{
                MenuProps: {
                    PaperProps: { sx: { borderRadius: 3, mt: 0.5, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' } }
                }
            }}
        >
            {children}
        </TextField>
    );
}