import { useEffect, useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    CardMedia,
    CircularProgress,
    Container,
    Grid,
    Pagination,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Link } from "react-router-dom";

import destinationPublicService from "../../services/public/destinationPublicService";
import { DestinationQueryParams, IDestination } from "../../types/destination";
import { fallbackTravelImage } from "../../constants/images";

interface DestinationCardData extends IDestination {
    coverUrl: string;
}

const PRIMARY = "#0f766e";
const PRIMARY_LIGHT = "#14b8a6";
const PRIMARY_DARK = "#0f4f4a";
const INFO = "#0284c7";
const TEXT_MAIN = "#1f2937";
const TEXT_MUTED = "#6b7280";
const BORDER = "rgba(15, 118, 110, 0.14)";

export default function DestinationsPage() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<DestinationCardData[]>([]);
    const [totalPages, setTotalPages] = useState(1);

    const fetchData = async (nextPage = page, nextSearch = search) => {
        setLoading(true);

        try {
            const params: DestinationQueryParams = {
                page: nextPage,
                limit: 9,
            };

            if (nextSearch.trim()) {
                params.search = nextSearch.trim();
            }

            const response = await destinationPublicService.getList(params);

            const itemsWithImages: DestinationCardData[] = await Promise.all(
                response.data.map(async (item) => {
                    try {
                        const images = await destinationPublicService.getImages(item.id);
                        const defaultImage = images.find((img) => img.isDefault) || images[0];

                        return {
                            ...item,
                            coverUrl:
                                item.defaultImageUrl ||
                                defaultImage?.url ||
                                fallbackTravelImage,
                        };
                    } catch {
                        return {
                            ...item,
                            coverUrl: item.defaultImageUrl || fallbackTravelImage,
                        };
                    }
                }),
            );

            setItems(itemsWithImages);
            setTotalPages(response.totalPages || 1);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(page, search);
    }, [page]);

    const handleSearch = () => {
        setPage(1);
        fetchData(1, search);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            handleSearch();
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                py: { xs: 3, md: 5 },
                background:
                    "radial-gradient(circle at top right, rgba(20, 184, 166, 0.14), transparent 30%), radial-gradient(circle at bottom left, rgba(2, 132, 199, 0.10), transparent 32%), linear-gradient(135deg, #f0fdfa 0%, #ecfeff 45%, #f8fafc 100%)",
            }}
        >
            <Container maxWidth="lg">
                <Stack spacing={3}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2.5, md: 3 },
                            borderRadius: 4,
                            border: `1px solid ${BORDER}`,
                            boxShadow: "0 10px 30px rgba(15, 118, 110, 0.08)",
                            background:
                                "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(240,253,250,0.96) 100%)",
                        }}
                    >
                        <Stack
                            direction={{ xs: "column", md: "row" }}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", md: "center" }}
                            spacing={2}
                        >
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <Box
                                    sx={{
                                        width: 52,
                                        height: 52,
                                        borderRadius: 3,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#fff",
                                        background: `linear-gradient(135deg, ${PRIMARY} 0%, ${INFO} 100%)`,
                                        boxShadow: "0 10px 22px rgba(15, 118, 110, 0.22)",
                                    }}
                                >
                                    <TravelExploreIcon />
                                </Box>

                                <Box>
                                    <Typography
                                        sx={{
                                            fontSize: { xs: "1.65rem", md: "2rem" },
                                            fontWeight: 900,
                                            color: TEXT_MAIN,
                                            letterSpacing: "-0.04em",
                                        }}
                                    >
                                        Điểm đến
                                    </Typography>

                                    <Typography color={TEXT_MUTED} fontSize={14.5}>
                                        Khám phá các điểm đến nổi bật trong và ngoài nước
                                    </Typography>
                                </Box>
                            </Stack>
                        </Stack>
                    </Paper>

                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            borderRadius: 4,
                            border: `1px solid ${BORDER}`,
                            boxShadow: "0 8px 24px rgba(15, 118, 110, 0.06)",
                            bgcolor: "#ffffff",
                        }}
                    >
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Tìm theo tên điểm đến hoặc quốc gia"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleKeyDown}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 3,
                                        bgcolor: "#f8fafc",
                                        fontSize: 14,
                                        "& fieldset": {
                                            borderColor: BORDER,
                                        },
                                        "&:hover fieldset": {
                                            borderColor: PRIMARY_LIGHT,
                                        },
                                        "&.Mui-focused fieldset": {
                                            borderColor: PRIMARY,
                                        },
                                    },
                                }}
                            />

                            <Button
                                variant="contained"
                                startIcon={<SearchIcon />}
                                onClick={handleSearch}
                                sx={{
                                    minWidth: { xs: "100%", md: 140 },
                                    borderRadius: 3,
                                    textTransform: "none",
                                    fontWeight: 800,
                                    bgcolor: PRIMARY,
                                    boxShadow: "0 8px 18px rgba(15, 118, 110, 0.22)",
                                    "&:hover": {
                                        bgcolor: PRIMARY_DARK,
                                        boxShadow: "0 10px 22px rgba(15, 118, 110, 0.30)",
                                    },
                                }}
                            >
                                Tìm kiếm
                            </Button>
                        </Stack>
                    </Paper>

                    {loading ? (
                        <Box display="flex" justifyContent="center" py={8}>
                            <Stack alignItems="center" spacing={2}>
                                <CircularProgress sx={{ color: PRIMARY }} />
                                <Typography color={TEXT_MUTED}>Đang tải điểm đến...</Typography>
                            </Stack>
                        </Box>
                    ) : items.length === 0 ? (
                        <Paper
                            elevation={0}
                            sx={{
                                py: 8,
                                textAlign: "center",
                                borderRadius: 4,
                                border: `1px solid ${BORDER}`,
                                bgcolor: "#ffffff",
                            }}
                        >
                            <Typography fontWeight={900} color={TEXT_MAIN}>
                                Không tìm thấy điểm đến phù hợp
                            </Typography>
                            <Typography mt={1} fontSize={14} color={TEXT_MUTED}>
                                Thử thay đổi từ khóa tìm kiếm hoặc quay lại sau.
                            </Typography>
                        </Paper>
                    ) : (
                        <Grid container spacing={2.5}>
                            {items.map((item) => (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                                    <Card
                                        sx={{
                                            height: "100%",
                                            borderRadius: 4,
                                            overflow: "hidden",
                                            border: `1px solid ${BORDER}`,
                                            boxShadow: "0 8px 26px rgba(15, 23, 42, 0.08)",
                                            transition: "all 0.28s ease",
                                            bgcolor: "#ffffff",
                                            "&:hover": {
                                                transform: "translateY(-6px)",
                                                boxShadow: "0 16px 38px rgba(15, 118, 110, 0.16)",
                                            },
                                            "&:hover img": {
                                                transform: "scale(1.08)",
                                            },
                                        }}
                                    >
                                        <Box sx={{ position: "relative", height: 220, overflow: "hidden" }}>
                                            <CardMedia
                                                component="img"
                                                image={item.coverUrl}
                                                alt={item.name}
                                                sx={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                    transition: "transform 0.45s ease",
                                                    filter: "brightness(0.88)",
                                                }}
                                            />

                                            <Box
                                                sx={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    background:
                                                        "linear-gradient(180deg, rgba(15,23,42,0.02) 0%, rgba(15,23,42,0.18) 45%, rgba(15,23,42,0.72) 100%)",
                                                }}
                                            />

                                            <Box
                                                sx={{
                                                    position: "absolute",
                                                    left: 16,
                                                    bottom: 14,
                                                    color: "#fff",
                                                }}
                                            >
                                                <Stack direction="row" alignItems="center" spacing={0.6}>
                                                    <LocationOnIcon sx={{ fontSize: 18 }} />
                                                    <Typography fontWeight={900} fontSize={18}>
                                                        {item.name}
                                                    </Typography>
                                                </Stack>

                                                <Typography fontSize={13} fontWeight={700} sx={{ opacity: 0.9 }}>
                                                    {item.country || "Chưa cập nhật quốc gia"}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <CardContent sx={{ p: 2.2 }}>
                                            <Typography
                                                variant="body2"
                                                color={TEXT_MUTED}
                                                sx={{
                                                    mb: 2,
                                                    minHeight: 60,
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: "vertical",
                                                    overflow: "hidden",
                                                    lineHeight: 1.55,
                                                }}
                                            >
                                                {item.description || "Chưa có mô tả"}
                                            </Typography>

                                            <Button
                                                component={Link}
                                                to={`/destinations/${item.id}`}
                                                variant="outlined"
                                                fullWidth
                                                endIcon={<ArrowForwardIcon />}
                                                sx={{
                                                    borderRadius: 3,
                                                    textTransform: "none",
                                                    fontWeight: 800,
                                                    color: PRIMARY,
                                                    borderColor: "rgba(15, 118, 110, 0.24)",
                                                    "&:hover": {
                                                        borderColor: PRIMARY,
                                                        bgcolor: "#f0fdfa",
                                                    },
                                                }}
                                            >
                                                Xem chi tiết
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}

                    {totalPages > 1 && (
                        <Box
                            display="flex"
                            justifyContent="center"
                            sx={{
                                pt: 1,
                                "& .MuiPaginationItem-root": {
                                    borderRadius: 2,
                                    fontWeight: 700,
                                },
                                "& .Mui-selected": {
                                    bgcolor: `${PRIMARY} !important`,
                                    color: "#fff",
                                },
                            }}
                        >
                            <Pagination
                                page={page}
                                count={totalPages}
                                onChange={(_, value) => setPage(value)}
                            />
                        </Box>
                    )}
                </Stack>
            </Container>
        </Box>
    );
}