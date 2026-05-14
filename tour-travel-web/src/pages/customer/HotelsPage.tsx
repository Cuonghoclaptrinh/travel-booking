import { useEffect, useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    CardMedia,
    CircularProgress,
    Container,
    MenuItem,
    Pagination,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { Link, useSearchParams } from "react-router-dom";

import destinationPublicService from "../../services/public/destinationPublicService";
import hotelPublicService from "../../services/public/hotelPublicService";
import { IDestination } from "../../types/destination";
import { IHotel, IHotelImage } from "../../types/hotel";

interface HotelCardData extends IHotel {
    coverUrl?: string;
}

export default function HotelsPage() {
    const [searchParams, setSearchParams] = useSearchParams();

    const [search, setSearch] = useState(searchParams.get("search") || "");
    const [destinationId, setDestinationId] = useState<string>(
        searchParams.get("destinationId") || ""
    );
    const [starRating, setStarRating] = useState<string>(
        searchParams.get("starRating") || ""
    );
    const [page, setPage] = useState(Number(searchParams.get("page") || 1));

    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<HotelCardData[]>([]);
    const [destinations, setDestinations] = useState<IDestination[]>([]);
    const [totalPages, setTotalPages] = useState(1);

    const fetchDestinations = async () => {
        const response = await destinationPublicService.getList({
            page: 1,
            limit: 1000,
        });
        setDestinations(response.data);
    };

    // const fetchData = async () => {
    //     setLoading(true);
    //     try {
    //         const response = await hotelPublicService.getList({
    //             search: search || undefined,
    //             destinationId: destinationId ? Number(destinationId) : undefined,
    //             starRating: starRating ? Number(starRating) : undefined,
    //             page,
    //             limit: 9,
    //             sortBy: "createdAt",
    //             sortOrder: "DESC",
    //         });

    //         const itemsWithImages = await Promise.all(
    //             response.data.map(async (item) => {
    //                 try {
    //                     const images = await hotelPublicService.getImages(item.id);
    //                     const defaultImage =
    //                         images.find((img) => img.isDefault) || images[0];

    //                     return {
    //                         ...item,
    //                         coverUrl: defaultImage?.url,
    //                     };
    //                 } catch {
    //                     return item;
    //                 }
    //             })
    //         );

    //         setItems(itemsWithImages);
    //         setTotalPages(response.totalPages || 1);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    useEffect(() => {
        fetchDestinations();
    }, []);

    useEffect(() => {
        // fetchData();
    }, [page]);

    const handleFilter = () => {
        const next = new URLSearchParams();

        if (search) next.set("search", search);
        if (destinationId) next.set("destinationId", destinationId);
        if (starRating) next.set("starRating", starRating);
        next.set("page", "1");

        setSearchParams(next);
        setPage(1);

        setTimeout(() => {
            // fetchData();
        }, 0);
    };

    return (
        <Container sx={{ py: 4 }}>
            <Stack spacing={3}>
                <Box>
                    <Typography variant="h4" fontWeight={700}>
                        Khách sạn
                    </Typography>
                    <Typography color="text.secondary">
                        Tìm khách sạn phù hợp với hành trình của bạn
                    </Typography>
                </Box>

                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                        fullWidth
                        placeholder="Tìm theo tên, địa chỉ, điểm đến"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <TextField
                        select
                        label="Điểm đến"
                        value={destinationId}
                        onChange={(e) => setDestinationId(e.target.value)}
                        sx={{ minWidth: 220 }}
                    >
                        <MenuItem value="">Tất cả</MenuItem>
                        {destinations.map((item) => (
                            <MenuItem key={item.id} value={item.id}>
                                {item.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Số sao"
                        value={starRating}
                        onChange={(e) => setStarRating(e.target.value)}
                        sx={{ minWidth: 140 }}
                    >
                        <MenuItem value="">Tất cả</MenuItem>
                        {[1, 2, 3, 4, 5].map((item) => (
                            <MenuItem key={item} value={item}>
                                {item} sao
                            </MenuItem>
                        ))}
                    </TextField>

                    <Button variant="contained" onClick={handleFilter}>
                        Lọc
                    </Button>
                </Stack>

                {loading ? (
                    <Box display="flex" justifyContent="center" py={6}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box
                        display="grid"
                        gridTemplateColumns={{
                            xs: "1fr",
                            sm: "1fr 1fr",
                            md: "1fr 1fr 1fr",
                        }}
                        gap={3}
                    >
                        {items.map((item) => (
                            <Card key={item.id}>
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
                                        {item.destination?.name || "Chưa có điểm đến"}
                                    </Typography>

                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        {item.address || "Chưa có địa chỉ"}
                                    </Typography>

                                    <Typography variant="body2" sx={{ mb: 2 }}>
                                        {item.starRating
                                            ? `${item.starRating} sao`
                                            : "Chưa cập nhật số sao"}
                                    </Typography>

                                    <Button
                                        component={Link}
                                        to={`/hotels/${item.id}`}
                                        variant="outlined"
                                        fullWidth
                                    >
                                        Xem chi tiết
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                )}

                <Box display="flex" justifyContent="center">
                    <Pagination
                        page={page}
                        count={totalPages}
                        onChange={(_, value) => {
                            setPage(value);

                            const next = new URLSearchParams(searchParams);
                            next.set("page", String(value));
                            setSearchParams(next);
                        }}
                        color="primary"
                    />
                </Box>
            </Stack>
        </Container>
    );
}