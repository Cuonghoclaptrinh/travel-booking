import { useEffect, useState } from "react";
import {
    Box,
    Chip,
    CircularProgress,
    Container,
    Grid,
    Stack,
    Typography,
} from "@mui/material";
import { useParams } from "react-router-dom";

import hotelPublicService from "../../services/public/hotelPublicService";
import { IHotel, IHotelAmenity, IHotelImage } from "../../types/hotel";

export default function HotelDetailPage() {
    const { id } = useParams();

    const [loading, setLoading] = useState(false);
    const [hotel, setHotel] = useState<IHotel | null>(null);
    const [images, setImages] = useState<IHotelImage[]>([]);
    const [amenities, setAmenities] = useState<IHotelAmenity[]>([]);

    const fetchData = async () => {
        if (!id) return;

        setLoading(true);
        try {
            const hotelId = Number(id);

            const [detail, imageList, amenityList] = await Promise.all([
                hotelPublicService.getDetail(hotelId),
                hotelPublicService.getImages(hotelId),
                hotelPublicService.getAmenities(hotelId),
            ]);

            setHotel(detail);
            setImages(imageList);
            setAmenities(amenityList);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" py={8}>
                <CircularProgress />
            </Box>
        );
    }

    if (!hotel) {
        return (
            <Container sx={{ py: 4 }}>
                <Typography>Không tìm thấy khách sạn.</Typography>
            </Container>
        );
    }

    return (
        <Container sx={{ py: 4 }}>
            <Stack spacing={4}>
                <Box>
                    <Typography variant="h4" fontWeight={700}>
                        {hotel.name}
                    </Typography>
                    <Typography color="text.secondary">
                        {hotel.destination?.name || "Chưa có điểm đến"}
                    </Typography>
                </Box>

                <Stack spacing={1}>
                    <Typography>
                        <strong>Địa chỉ:</strong> {hotel.address || "Chưa cập nhật"}
                    </Typography>
                    <Typography>
                        <strong>Số sao:</strong>{" "}
                        {hotel.starRating ? `${hotel.starRating} sao` : "Chưa cập nhật"}
                    </Typography>
                    <Typography>
                        <strong>SĐT liên hệ:</strong>{" "}
                        {hotel.contactPhone || "Chưa cập nhật"}
                    </Typography>
                    <Typography>
                        <strong>Tọa độ:</strong>{" "}
                        {hotel.latitude && hotel.longitude
                            ? `${hotel.latitude}, ${hotel.longitude}`
                            : "Chưa cập nhật"}
                    </Typography>
                </Stack>

                <Box>
                    <Typography variant="h6" fontWeight={700} mb={2}>
                        Hình ảnh
                    </Typography>

                    <Grid container spacing={2}>
                        {images.length > 0 ? (
                            images.map((img) => (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={img.id}>
                                    <Box
                                        component="img"
                                        src={img.url}
                                        alt={hotel.name}
                                        sx={{
                                            width: "100%",
                                            height: 240,
                                            objectFit: "cover",
                                            borderRadius: 2,
                                            border: img.isDefault
                                                ? "3px solid #1976d2"
                                                : "1px solid #e5e7eb",
                                        }}
                                    />
                                </Grid>
                            ))
                        ) : (
                            <Typography color="text.secondary">
                                Chưa có hình ảnh
                            </Typography>
                        )}
                    </Grid>
                </Box>

                <Box>
                    <Typography variant="h6" fontWeight={700} mb={2}>
                        Tiện ích
                    </Typography>

                    <Stack direction="row" flexWrap="wrap" gap={1}>
                        {amenities.length > 0 ? (
                            amenities.map((item) => (
                                <Chip
                                    key={`${item.hotelId}-${item.amenityId}`}
                                    label={item.amenity.name}
                                />
                            ))
                        ) : (
                            <Typography color="text.secondary">
                                Chưa có tiện ích
                            </Typography>
                        )}
                    </Stack>
                </Box>
            </Stack>
        </Container>
    );
}