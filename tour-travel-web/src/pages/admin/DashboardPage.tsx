import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { useAuth } from "../../hooks/useAuth";
import dashboardService, {
    DashboardOverview, DashboardRange
} from "../../services/admin/dashboardService";

function formatCurrency(value: string | number | undefined | null) {
    return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

function formatDate(value?: string) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("vi-VN");
}

function formatDateTime(value?: string) {
    if (!value) return "-";
    return new Date(value).toLocaleString("vi-VN");
}

function getStatusColor(status?: string) {
    switch (status) {
        case "paid":
        case "confirmed":
        case "success":
        case "open":
            return "success";
        case "pending":
        case "pending_payment":
        case "unpaid":
            return "warning";
        case "expired":
        case "cancelled":
        case "failed":
            return "error";
        case "full":
            return "info";
        default:
            return "default";
    }
}

export default function DashboardPage() {
    const { user } = useAuth();

    const [data, setData] = useState<DashboardOverview | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");

    const [range, setRange] = useState<DashboardRange>("7d");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            setError("");

            const params: {
                range: DashboardRange;
                from?: string;
                to?: string;
            } = {
                range,
            };

            if (range === "custom") {
                if (from) {
                    params.from = from;
                }

                if (to) {
                    params.to = to;
                }
            }

            const result = await dashboardService.getOverview(params);

            setData(result);
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                "Không tải được dữ liệu dashboard";

            setError(Array.isArray(message) ? message.join(", ") : message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (range === "custom") {
            if (!from || !to) return;
        }

        fetchDashboard();
    }, [range]);

    const revenueChartData = useMemo(() => {
        const source = data?.revenueByDay || data?.revenueLast7Days || [];

        return source.map((item) => ({
            ...item,
            label: new Date(item.date).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
            }),
        }));
    }, [data]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" py={8}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    if (!data) {
        return <Alert severity="info">Không có dữ liệu dashboard</Alert>;
    }

    const stats = data.stats;

    const statCards = [
        {
            label: "Tổng user",
            value: stats.totalUsers,
            color: "#1677ff",
            bg: "linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)",
        },
        {
            label: "Tổng tour",
            value: stats.totalTours,
            color: "#722ed1",
            bg: "linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)",
        },
        {
            label: "Tổng booking",
            value: stats.totalBookings,
            color: "#13c2c2",
            bg: "linear-gradient(135deg, #e6fffb 0%, #b5f5ec 100%)",
        },
        {
            label: "Tổng doanh thu",
            value: formatCurrency(stats.totalRevenue),
            color: "#52c41a",
            bg: "linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)",
        },
        {
            label: "Đã thanh toán",
            value: stats.paidBookings,
            color: "#389e0d",
            bg: "linear-gradient(135deg, #f6ffed 0%, #b7eb8f 100%)",
        },
        {
            label: "Chờ thanh toán",
            value: stats.pendingPaymentBookings,
            color: "#d48806",
            bg: "linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)",
        },
        {
            label: "Hết hạn",
            value: stats.expiredBookings,
            color: "#595959",
            bg: "linear-gradient(135deg, #fafafa 0%, #d9d9d9 100%)",
        },
        {
            label: "Đã hủy",
            value: stats.cancelledBookings,
            color: "#cf1322",
            bg: "linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)",
        },
    ];

    return (
        <Box sx={{
            minHeight: "100vh",
            p: { xs: 2, md: 3 },
            borderRadius: 4,
            background:
                "linear-gradient(135deg, #f6f9ff 0%, #eef6ff 45%, #f8f5ff 100%)",
        }}>
            <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
                spacing={2}
                mb={3}
            >
                <Box>
                    <Typography variant="h4" fontWeight={700}>
                        Admin Dashboard
                    </Typography>
                    <Typography color="text.secondary">
                        Xin chào, {user?.name} - {user?.email}
                    </Typography>
                </Box>

                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    alignItems={{ xs: "stretch", sm: "center" }}
                    width={{ xs: "100%", md: "auto" }}
                >
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>Thời gian</InputLabel>
                        <Select
                            label="Thời gian"
                            value={range}
                            onChange={(event) =>
                                setRange(event.target.value as DashboardRange)
                            }
                        >
                            <MenuItem value="today">Hôm nay</MenuItem>
                            <MenuItem value="7d">7 ngày gần nhất</MenuItem>
                            <MenuItem value="30d">30 ngày gần nhất</MenuItem>
                            <MenuItem value="this_month">Tháng này</MenuItem>
                            <MenuItem value="last_month">Tháng trước</MenuItem>
                            <MenuItem value="3m">3 tháng gần nhất</MenuItem>
                            <MenuItem value="6m">6 tháng gần nhất</MenuItem>
                            <MenuItem value="this_year">Năm nay</MenuItem>
                            <MenuItem value="custom">Tùy chọn</MenuItem>
                        </Select>
                    </FormControl>

                    {range === "custom" && (
                        <>
                            <TextField
                                size="small"
                                label="Từ ngày"
                                type="date"
                                value={from}
                                onChange={(event) => setFrom(event.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />

                            <TextField
                                size="small"
                                label="Đến ngày"
                                type="date"
                                value={to}
                                onChange={(event) => setTo(event.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />

                            <Button
                                variant="contained"
                                onClick={fetchDashboard}
                                disabled={!from || !to}
                            >
                                Áp dụng
                            </Button>
                        </>
                    )}
                </Stack>
            </Stack>

            <Grid container spacing={2} mb={3}>
                {statCards.map((item) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item.label}>
                        <Card
                            elevation={0}
                            sx={{
                                height: "100%",
                                borderRadius: 4,
                                background: item.bg,
                                border: "1px solid rgba(255,255,255,0.7)",
                                boxShadow: "0 10px 28px rgba(15, 23, 42, 0.08)",
                                transition: "all 0.25s ease",
                                overflow: "hidden",
                                position: "relative",
                                "&:hover": {
                                    transform: "translateY(-4px)",
                                    boxShadow: "0 16px 36px rgba(15, 23, 42, 0.14)",
                                },
                                "&::after": {
                                    content: '""',
                                    position: "absolute",
                                    width: 90,
                                    height: 90,
                                    right: -28,
                                    top: -28,
                                    borderRadius: "50%",
                                    background: "rgba(255,255,255,0.45)",
                                },
                            }}
                        >
                            <CardContent sx={{ position: "relative", zIndex: 1 }}>
                                <Typography
                                    gutterBottom
                                    sx={{
                                        color: "rgba(0,0,0,0.55)",
                                        fontWeight: 600,
                                    }}
                                >
                                    {item.label}
                                </Typography>

                                <Typography
                                    variant="h5"
                                    fontWeight={800}
                                    sx={{ color: item.color }}
                                >
                                    {item.value}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={2} mb={3}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Paper elevation={2} sx={{ p: 2, height: 360 }}>
                        <Typography variant="h6" fontWeight={700} mb={2}>
                            Doanh thu theo thời gian
                        </Typography>

                        <ResponsiveContainer width="100%" height="85%">
                            <BarChart data={revenueChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="label" />
                                <YAxis
                                    tickFormatter={(value) =>
                                        `${Number(value / 1000000).toLocaleString("vi-VN")}tr`
                                    }
                                />
                                <Tooltip
                                    formatter={(value: any, name: any) => {
                                        if (name === "revenue") {
                                            return [formatCurrency(value), "Doanh thu"];
                                        }

                                        return [value, "Số booking"];
                                    }}
                                    labelFormatter={(label) => `Ngày ${label}`}
                                />
                                <Bar
                                    dataKey="revenue"
                                    name="revenue"
                                    fill="#1677ff"
                                    radius={[8, 8, 0, 0]}
                                    maxBarSize={46}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, lg: 4 }}>
                    {/* <Paper elevation={2} sx={{ p: 2, height: 360 }}> */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            height: 380,
                            borderRadius: 4,
                            background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
                            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                            border: "1px solid #eef2ff",
                        }}
                    >
                        <Typography variant="h6" fontWeight={700} mb={2}>
                            Top tour theo doanh thu
                        </Typography>

                        <Stack spacing={1.5}>
                            {data.topToursByRevenue.map((tour, index) => (
                                <Box key={tour.tourId}>
                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="flex-start"
                                        spacing={1}
                                    >
                                        <Box>
                                            <Typography fontWeight={700}>
                                                #{index + 1} {tour.tourName}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {tour.bookingCount} booking · {tour.guestCount} khách
                                            </Typography>
                                        </Box>

                                        <Typography fontWeight={700} whiteSpace="nowrap">
                                            {formatCurrency(tour.revenue)}
                                        </Typography>
                                    </Stack>
                                </Box>
                            ))}

                            {data.topToursByRevenue.length === 0 && (
                                <Typography color="text.secondary">
                                    Chưa có dữ liệu doanh thu.
                                </Typography>
                            )}
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>

            <Grid container spacing={2}>
                <Grid size={{ xs: 12 }} >
                    <Paper elevation={2}>
                        <Box p={2}>
                            <Typography variant="h6" fontWeight={700} gutterBottom>
                                Việc cần xử lý
                            </Typography>

                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Mã booking</TableCell>
                                        <TableCell>Khách hàng</TableCell>
                                        <TableCell>Tour</TableCell>
                                        <TableCell>Số tiền</TableCell>
                                        <TableCell>Thanh toán</TableCell>
                                        <TableCell>Hạn thanh toán</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {data.actionItems.map((booking) => (
                                        <TableRow key={booking.id}>
                                            <TableCell>{booking.code}</TableCell>
                                            <TableCell>
                                                <Typography fontWeight={600}>
                                                    {booking.contactName}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {booking.contactEmail}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{booking.tourName || "-"}</TableCell>
                                            <TableCell>
                                                {formatCurrency(booking.totalAmount)}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    label={booking.paymentStatus}
                                                    color={getStatusColor(booking.paymentStatus) as any}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {formatDateTime(booking.expiresAt)}
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {data.actionItems.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">
                                                Không có việc cần xử lý
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Box>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, lg: 7 }} >
                    <Paper elevation={2}>
                        <Box p={2}>
                            <Typography variant="h6" fontWeight={700} gutterBottom>
                                Lịch khởi hành sắp tới
                            </Typography>

                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Mã lịch</TableCell>
                                        <TableCell>Tour</TableCell>
                                        <TableCell>Ngày đi</TableCell>
                                        <TableCell>Còn chỗ</TableCell>
                                        <TableCell>Trạng thái</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {data.upcomingDepartures.map((departure) => (
                                        <TableRow key={departure.departureId}>
                                            <TableCell>{departure.code}</TableCell>
                                            <TableCell>{departure.tourName || "-"}</TableCell>
                                            <TableCell>
                                                {formatDate(departure.departureDate)}
                                            </TableCell>
                                            <TableCell>
                                                {departure.availableSlots}/{departure.capacity}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    label={departure.status}
                                                    color={getStatusColor(departure.status) as any}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {data.upcomingDepartures.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center">
                                                Không có lịch khởi hành sắp tới
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Box>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, lg: 5 }}>
                    <Paper elevation={2}>
                        <Box p={2}>
                            <Typography variant="h6" fontWeight={700} gutterBottom>
                                Tóm tắt doanh thu
                            </Typography>

                            <Stack spacing={2}>
                                {/* {data.revenueLast7Days.map((item) => (
                                    <Stack
                                        key={item.date}
                                        direction="row"
                                        justifyContent="space-between"
                                    >
                                        <Typography>{formatDate(item.date)}</Typography>
                                        <Box textAlign="right">
                                            <Typography fontWeight={700}>
                                                {formatCurrency(item.revenue)}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {item.bookingCount} booking
                                            </Typography>
                                        </Box>
                                    </Stack>
                                ))} */}
                                <Box
                                    sx={{
                                        maxHeight: 320,
                                        overflowY: "auto",
                                        pr: 1,
                                        mt: 2,
                                        "&::-webkit-scrollbar": {
                                            width: 6,
                                        },
                                        "&::-webkit-scrollbar-thumb": {
                                            backgroundColor: "#cbd5e1",
                                            borderRadius: 999,
                                        },
                                    }}
                                >
                                    {revenueChartData.map((item) => (
                                        <Box
                                            key={item.label}
                                            sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                py: 1.2,
                                                borderBottom: "1px solid #f0f0f0",
                                            }}
                                        >
                                            <Typography fontWeight={600}>
                                                {item.label}
                                            </Typography>

                                            <Typography fontWeight={700} color="#52c41a">
                                                {formatCurrency(item.revenue)}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Stack>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}