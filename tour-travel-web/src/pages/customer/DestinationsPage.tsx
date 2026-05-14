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
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { Link } from "react-router-dom";

import destinationPublicService from "../../services/public/destinationPublicService";
import { DestinationQueryParams, IDestination } from "../../types/destination";
import { fallbackTravelImage } from "../../constants/images";

interface DestinationCardData extends IDestination {
    coverUrl: string;
}



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
                        const defaultImage =
                            images.find((img) => img.isDefault) || images[0];

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
                            coverUrl:
                                item.defaultImageUrl ||
                                fallbackTravelImage,
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
        fetchData();
    };

    return (
        <Container sx={{ py: 4 }}>
            <Stack spacing={3}>
                <Box>
                    <Typography variant="h4" fontWeight={700}>
                        Điểm đến
                    </Typography>
                    <Typography color="text.secondary">
                        Khám phá các điểm đến nổi bật
                    </Typography>
                </Box>

                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                        fullWidth
                        placeholder="Tìm theo tên hoặc quốc gia"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <Button variant="contained" onClick={handleSearch}>
                        Tìm kiếm
                    </Button>
                </Stack>

                {loading ? (
                    <Box display="flex" justifyContent="center" py={6}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Grid container spacing={3}>
                        {items.map((item) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                                <Card sx={{ height: "100%" }}>
                                    {item.coverUrl ? (
                                        <CardMedia
                                            component="img"
                                            height="220"
                                            image={item.coverUrl}
                                            alt={item.name}
                                        />
                                    ) : null}

                                    <CardContent>
                                        <Typography variant="h6" fontWeight={700}>
                                            {item.name}
                                        </Typography>

                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ mb: 1 }}
                                        >
                                            {item.country || "Chưa cập nhật quốc gia"}
                                        </Typography>

                                        <Typography
                                            variant="body2"
                                            sx={{
                                                mb: 2,
                                                display: "-webkit-box",
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                            }}
                                        >
                                            {item.description || "Chưa có mô tả"}
                                        </Typography>

                                        <Button
                                            component={Link}
                                            to={`/destinations/${item.id}`}
                                            variant="outlined"
                                            fullWidth
                                        >
                                            Xem chi tiết
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}

                <Box display="flex" justifyContent="center">
                    <Pagination
                        page={page}
                        count={totalPages}
                        onChange={(_, value) => setPage(value)}
                        color="primary"
                    />
                </Box>
            </Stack>
        </Container>
    );
}