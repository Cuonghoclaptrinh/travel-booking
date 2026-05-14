import {
    Box,
    Button,
    Container,
    Divider,
    Grid,
    IconButton,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import YouTubeIcon from "@mui/icons-material/YouTube";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import EmailIcon from '@mui/icons-material/Email';

const quickLinks = [
    "Trang chủ",
    "Tour trong nước",
    "Tour nước ngoài",
    "Combo",
    "Khuyến mãi",
    "Cẩm nang du lịch",
    "Liên hệ",
];

const supportLinks = [
    "Hướng dẫn đặt tour",
    "Chính sách thanh toán",
    "Chính sách hủy đổi",
    "Điều khoản & điều kiện",
    "Câu hỏi thường gặp",
];

const paymentMethods = ["VISA", "MC", "NAPAS", "MOMO"];

export default function CustomerFooter() {
    return (
        <>
            <Box py={2} sx={{
                width: '100vw',
                marginLeft: 'calc(50% - 50vw)', bgcolor: 'primary.main', color: '#fff'
            }}>
                <Container maxWidth="lg">
                    <Grid container spacing={3} alignItems="center">
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Stack direction="row" spacing={2.5} alignItems="center">
                                <Box sx={{ width: 72, height: 72, borderRadius: '50%', bgcolor: 'rgba(255,255,255,.15)', border: '2px solid rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <EmailIcon fontSize="large" />
                                </Box>
                                <Box>
                                    <Typography variant="h6" fontWeight={900}>Nhận ưu đãi mới nhất từ Viettravel</Typography>
                                    <Typography color="rgba(255,255,255,.85)" fontSize={12}>
                                        Đăng ký email để nhận khuyến mãi và thông tin tour mới và mẹo du lịch hữu ích.
                                    </Typography>
                                </Box>
                            </Stack>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField fullWidth placeholder="Nhập email của bạn" sx={{ bgcolor: '#fff', borderRadius: 2, '& fieldset': { border: 'none' } }} />
                                <Button variant="contained" sx={{ bgcolor: '#003b7a', px: 4, borderRadius: 2, whiteSpace: 'nowrap', '&:hover': { bgcolor: '#002b5c' } }}>
                                    Đăng ký ngay
                                </Button>
                            </Stack>
                        </Grid>
                    </Grid>
                </Container>
            </Box>
            <Box
                component="footer"
                sx={{
                    width: "100vw",
                    marginLeft: "calc(50% - 50vw)",
                    bgcolor: "#062b55",
                    color: "#fff",
                    pt: 6,
                    pb: 3,
                }}
            >

                <Container maxWidth="lg">
                    <Grid container spacing={4}>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                                <FlightTakeoffIcon fontSize="small" />
                                <Typography fontWeight={900} fontSize={20}>
                                    VIETTRAVEL
                                </Typography>
                            </Stack>

                            <Typography color="rgba(255,255,255,.75)" fontSize={14}>
                                Viettravel – Đồng hành cùng bạn trên mọi nẻo đường. Chúng tôi
                                cam kết mang đến những chuyến đi an toàn, trải nghiệm trọn vẹn
                                và đáng nhớ.
                            </Typography>

                            <Stack direction="row" spacing={0.5} mt={2}>
                                {[<FacebookIcon />, <InstagramIcon />, <YouTubeIcon />].map(
                                    (icon, index) => (
                                        <IconButton
                                            key={index}
                                            size="small"
                                            sx={{
                                                color: "#fff",
                                                bgcolor: "rgba(255,255,255,.1)",
                                                "&:hover": {
                                                    bgcolor: "rgba(255,255,255,.2)",
                                                },
                                            }}
                                        >
                                            {icon}
                                        </IconButton>
                                    ),
                                )}
                            </Stack>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                            <Typography fontWeight={900} mb={2}>
                                Liên kết nhanh
                            </Typography>

                            {quickLinks.map((item) => (
                                <Typography
                                    key={item}
                                    color="rgba(255,255,255,.75)"
                                    mb={0.8}
                                    fontSize={14}
                                    sx={{
                                        cursor: "pointer",
                                        "&:hover": {
                                            color: "#fff",
                                        },
                                    }}
                                >
                                    {item}
                                </Typography>
                            ))}
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                            <Typography fontWeight={900} mb={2}>
                                Hỗ trợ khách hàng
                            </Typography>

                            {supportLinks.map((item) => (
                                <Typography
                                    key={item}
                                    color="rgba(255,255,255,.75)"
                                    mb={0.8}
                                    fontSize={14}
                                    sx={{
                                        cursor: "pointer",
                                        "&:hover": {
                                            color: "#fff",
                                        },
                                    }}
                                >
                                    {item}
                                </Typography>
                            ))}
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                            <Typography fontWeight={900} mb={2}>
                                Thông tin liên hệ
                            </Typography>

                            <Stack spacing={0.8}>
                                <Typography color="rgba(255,255,255,.75)" fontSize={13}>
                                    📍 Tòa nhà Viettravel, 123 Cầu Giấy, Hà Nội
                                </Typography>
                                <Typography color="rgba(255,255,255,.75)" fontSize={13}>
                                    📞 1900 1234
                                </Typography>
                                <Typography color="rgba(255,255,255,.75)" fontSize={13}>
                                    ✉️ info@viettravel.vn
                                </Typography>
                                <Typography color="rgba(255,255,255,.75)" fontSize={13}>
                                    🕐 Thứ 2 - Chủ nhật: 08:00 - 21:00
                                </Typography>
                            </Stack>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                            <Typography fontWeight={900} mb={2}>
                                Tải app Viettravel
                            </Typography>

                            <Stack spacing={1.5}>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        bgcolor: "#000",
                                        borderRadius: 2,
                                        px: 2,
                                        py: 1,
                                        cursor: "pointer",
                                        border: "1px solid rgba(255,255,255,.2)",
                                    }}
                                >
                                    <Box component="span" sx={{ fontSize: 20 }}>
                                        🍎
                                    </Box>
                                    <Box>
                                        <Typography fontSize={10} color="rgba(255,255,255,.7)">
                                            Download on the
                                        </Typography>
                                        <Typography fontSize={13} fontWeight={700}>
                                            App Store
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        bgcolor: "#000",
                                        borderRadius: 2,
                                        px: 2,
                                        py: 1,
                                        cursor: "pointer",
                                        border: "1px solid rgba(255,255,255,.2)",
                                    }}
                                >
                                    <PhoneAndroidIcon sx={{ fontSize: 24 }} />
                                    <Box>
                                        <Typography fontSize={10} color="rgba(255,255,255,.7)">
                                            GET IT ON
                                        </Typography>
                                        <Typography fontSize={13} fontWeight={700}>
                                            Google Play
                                        </Typography>
                                    </Box>
                                </Box>
                            </Stack>
                        </Grid>
                    </Grid>

                    <Divider sx={{ borderColor: "rgba(255,255,255,.15)", my: 4 }} />

                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={2}
                    >
                        <Typography color="rgba(255,255,255,.65)" fontSize={13}>
                            © 2026 Viettravel. All rights reserved.
                        </Typography>

                        <Stack direction="row" spacing={1} alignItems="center">
                            {paymentMethods.map((pay) => (
                                <Box
                                    key={pay}
                                    sx={{
                                        bgcolor: "#fff",
                                        borderRadius: 1,
                                        px: 1,
                                        py: 0.3,
                                        fontSize: 10,
                                        fontWeight: 900,
                                        color: "#062b55",
                                        letterSpacing: 0.5,
                                    }}
                                >
                                    {pay}
                                </Box>
                            ))}
                        </Stack>
                    </Stack>
                </Container>
            </Box>
        </>)
}