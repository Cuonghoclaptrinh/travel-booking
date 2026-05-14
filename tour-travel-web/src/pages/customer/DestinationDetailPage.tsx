// import { useEffect, useState } from "react";
// import {
//     Box,
//     Button,
//     Chip,
//     CircularProgress,
//     Container,
//     Grid,
//     Stack,
//     Typography,
// } from "@mui/material";
// import { Link, useParams } from "react-router-dom";

// import destinationPublicService from "../../services/public/destinationPublicService";
// import hotelPublicService from "../../services/public/hotelPublicService";
// import { IDestination, IDestinationImage } from "../../types/destination";
// import { IHotel } from "../../types/hotel";

// export default function DestinationDetailPage() {
//     const { id } = useParams();

//     const [loading, setLoading] = useState(false);
//     const [destination, setDestination] = useState<IDestination | null>(null);
//     const [images, setImages] = useState<IDestinationImage[]>([]);
//     const [hotels, setHotels] = useState<IHotel[]>([]);

//     const fetchData = async () => {
//         if (!id) return;

//         setLoading(true);
//         try {
//             const destinationId = Number(id);

//             const [detail, imageList, hotelList] = await Promise.all([
//                 destinationPublicService.getDetail(destinationId),
//                 destinationPublicService.getImages(destinationId),
//                 hotelPublicService.getByDestination(destinationId, {
//                     page: 1,
//                     limit: 6,
//                     sortBy: "createdAt",
//                     sortOrder: "DESC",
//                 }),
//             ]);

//             setDestination(detail);
//             setImages(imageList);
//             setHotels(hotelList.data);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchData();
//     }, [id]);

//     if (loading) {
//         return (
//             <Box display="flex" justifyContent="center" py={8}>
//                 <CircularProgress />
//             </Box>
//         );
//     }

//     if (!destination) {
//         return (
//             <Container sx={{ py: 4 }}>
//                 <Typography>Không tìm thấy điểm đến.</Typography>
//             </Container>
//         );
//     }

//     return (
//         <Container sx={{ py: 4 }}>
//             <Stack spacing={4}>
//                 <Box>
//                     <Typography variant="h4" fontWeight={700}>
//                         {destination.name}
//                     </Typography>
//                     <Typography color="text.secondary">
//                         {destination.country || "Chưa cập nhật quốc gia"}
//                     </Typography>
//                 </Box>

//                 <Typography>{destination.description || "Chưa có mô tả"}</Typography>

//                 <Box>
//                     <Typography variant="h6" fontWeight={700} mb={2}>
//                         Hình ảnh
//                     </Typography>

//                     <Grid container spacing={2}>
//                         {images.length > 0 ? (
//                             images.map((img) => (
//                                 <Grid size={{ xs: 12, sm: 6, md: 4 }} key={img.id}>
//                                     <Box
//                                         component="img"
//                                         src={img.url}
//                                         alt={destination.name}
//                                         sx={{
//                                             width: "100%",
//                                             height: 240,
//                                             objectFit: "cover",
//                                             borderRadius: 2,
//                                             border: img.isDefault
//                                                 ? "3px solid #1976d2"
//                                                 : "1px solid #e5e7eb",
//                                         }}
//                                     />
//                                 </Grid>
//                             ))
//                         ) : (
//                             <Typography color="text.secondary">
//                                 Chưa có hình ảnh
//                             </Typography>
//                         )}
//                     </Grid>
//                 </Box>

//                 <Box>
//                     <Stack
//                         direction="row"
//                         justifyContent="space-between"
//                         alignItems="center"
//                         mb={2}
//                     >
//                         <Typography variant="h6" fontWeight={700}>
//                             Khách sạn tại điểm đến này
//                         </Typography>

//                         <Button
//                             component={Link}
//                             to={`/hotels?destinationId=${destination.id}`}
//                         >
//                             Xem tất cả
//                         </Button>
//                     </Stack>

//                     <Stack direction="row" flexWrap="wrap" gap={1}>
//                         {hotels.length > 0 ? (
//                             hotels.map((hotel) => (
//                                 <Chip
//                                     key={hotel.id}
//                                     label={hotel.name}
//                                     component={Link}
//                                     to={`/hotels/${hotel.id}`}
//                                     clickable
//                                 />
//                             ))
//                         ) : (
//                             <Typography color="text.secondary">
//                                 Chưa có khách sạn
//                             </Typography>
//                         )}
//                     </Stack>
//                 </Box>
//             </Stack>
//         </Container>
//     );
// }




import { useEffect, useState } from "react";
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Container,
    Grid,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import { Link, useParams } from "react-router-dom";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PublicIcon from "@mui/icons-material/Public";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";

import destinationPublicService from "../../services/public/destinationPublicService";
import hotelPublicService from "../../services/public/hotelPublicService";
import {
    destinationRegionLabel,
    destinationTypeLabel,
    IDestination,
    IDestinationImage,
} from "../../types/destination";
import { IHotel } from "../../types/hotel";
import OpenStreetMapBox from "../../components/maps/OpenStreetMapBox";
import { Tour } from "../../types/tour";
import tourPublicService from "../../services/public/tourPublicService";
import { fallbackTravelImage } from "../../constants/images";


export default function DestinationDetailPage() {
    const { id } = useParams();

    const [loading, setLoading] = useState(false);
    const [destination, setDestination] = useState<IDestination | null>(null);
    const [images, setImages] = useState<IDestinationImage[]>([]);
    const [hotels, setHotels] = useState<IHotel[]>([]);

    const [relatedTours, setRelatedTours] = useState<Tour[]>([]);

    const fetchData = async () => {
        if (!id) return;

        setLoading(true);

        try {
            const destinationId = Number(id);

            const [detail, imageList, tourList] = await Promise.all([
                destinationPublicService.getDetail(destinationId),
                destinationPublicService.getImages(destinationId),
                tourPublicService.getPaging({
                    destinationId,
                    page: 1,
                    limit: 6,
                }),
            ]);

            setDestination(detail);
            setImages(imageList);
            setRelatedTours(tourList.items);

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

    if (!destination) {
        return (
            <Container sx={{ py: 4 }}>
                <Typography>Không tìm thấy điểm đến.</Typography>
            </Container>
        );
    }

    const hasMapLocation =
        Number.isFinite(Number(destination.latitude)) &&
        Number.isFinite(Number(destination.longitude));

    return (
        <Container sx={{ py: 4 }}>
            <Stack spacing={4}>
                <Paper
                    sx={{
                        p: { xs: 2.5, md: 4 },
                        borderRadius: 4,
                        background:
                            "linear-gradient(135deg, rgba(25,118,210,.08), rgba(14,165,233,.08))",
                    }}
                    elevation={0}
                >
                    <Stack spacing={2}>
                        <Box>
                            <Typography variant="h4" fontWeight={800}>
                                {destination.name}
                            </Typography>

                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                mt={1}
                                color="text.secondary"
                            >
                                <PublicIcon fontSize="small" />
                                <Typography>
                                    {destination.country || "Chưa cập nhật quốc gia"}
                                </Typography>
                            </Stack>
                        </Box>

                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {destination.region && (
                                <Chip
                                    color="primary"
                                    variant="outlined"
                                    label={destinationRegionLabel[destination.region]}
                                />
                            )}

                            {destination.destinationType && (
                                <Chip
                                    color="success"
                                    variant="outlined"
                                    label={destinationTypeLabel[destination.destinationType]}
                                />
                            )}

                            {destination.isFeatured && (
                                <Chip color="error" label="Điểm đến nổi bật" />
                            )}
                        </Stack>

                        <Typography sx={{ lineHeight: 1.8 }}>
                            {destination.description || "Chưa có mô tả"}
                        </Typography>
                    </Stack>
                </Paper>

                <Box>
                    <Typography variant="h6" fontWeight={800} mb={2}>
                        Hình ảnh
                    </Typography>

                    <Grid container spacing={2}>
                        {images.length > 0 ? (
                            images.map((img) => (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={img.id}>
                                    <Box
                                        component="img"
                                        src={img.url || fallbackTravelImage}
                                        alt={destination.name}
                                        sx={{
                                            width: "100%",
                                            height: 240,
                                            objectFit: "cover",
                                            borderRadius: 3,
                                            border: img.isDefault
                                                ? "3px solid #1976d2"
                                                : "1px solid #e5e7eb",
                                            boxShadow: "0 12px 32px rgba(15,23,42,.12)",
                                        }}
                                    />
                                </Grid>
                            ))
                        ) : (
                            <Grid size={{ xs: 12 }}>
                                <Typography color="text.secondary">
                                    Chưa có hình ảnh
                                </Typography>
                            </Grid>
                        )}
                    </Grid>
                </Box>

                <Box>
                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        mb={2}
                    >
                        <LocationOnIcon color="primary" />
                        <Typography variant="h6" fontWeight={800}>
                            Vị trí điểm đến
                        </Typography>
                    </Stack>

                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            borderRadius: 4,
                            overflow: "hidden",
                        }}
                    >
                        <Stack spacing={2}>
                            <Box>
                                <Typography fontWeight={700}>
                                    {destination.mapAddress || destination.name}
                                </Typography>

                                {hasMapLocation ? (
                                    <Typography variant="body2" color="text.secondary">
                                        Tọa độ: {destination.latitude}, {destination.longitude}
                                    </Typography>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        Chưa cập nhật tọa độ bản đồ cho điểm đến này.
                                    </Typography>
                                )}
                            </Box>

                            <OpenStreetMapBox
                                lat={destination.latitude ?? null}
                                lng={destination.longitude ?? null}
                                title={destination.name}
                                address={destination.mapAddress ?? null}
                                height={380}
                                zoom={12}
                            />
                        </Stack>
                    </Paper>
                </Box>

                <Box>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={2}
                    >
                        <Stack direction="row" spacing={1} alignItems="center">
                            <TravelExploreIcon color="primary" />
                            <Typography variant="h6" fontWeight={800}>
                                Tour liên quan
                            </Typography>
                        </Stack>

                        <Button
                            component={Link}
                            to={`/tours?destinationId=${destination.id}`}
                        >
                            Xem tất cả
                        </Button>
                    </Stack>

                    <Grid container spacing={2}>
                        {relatedTours.length > 0 ? (
                            relatedTours.map((tour) => (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={tour.id}>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            height: "100%",
                                            borderRadius: 3,
                                            overflow: "hidden",
                                            transition: "0.25s",
                                            "&:hover": {
                                                transform: "translateY(-3px)",
                                                boxShadow: 4,
                                            },
                                        }}
                                    >
                                        {tour.images ? (
                                            <Box
                                                component="img"
                                                src={tour.images[0]?.url || fallbackTravelImage}
                                                alt={tour.name}
                                                sx={{
                                                    width: "100%",
                                                    height: 160,
                                                    objectFit: "cover",
                                                }}
                                            />
                                        ) : null}

                                        <Box sx={{ p: 2 }}>
                                            <Typography
                                                fontWeight={800}
                                                sx={{
                                                    mb: 1,
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: "vertical",
                                                    overflow: "hidden",
                                                }}
                                            >
                                                {tour.name}
                                            </Typography>

                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                    mb: 1.5,
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: "vertical",
                                                    overflow: "hidden",
                                                }}
                                            >
                                                {tour.shortDescription || "Khám phá hành trình hấp dẫn tại điểm đến này."}
                                            </Typography>

                                            <Stack
                                                direction="row"
                                                justifyContent="space-between"
                                                alignItems="center"
                                                spacing={1}
                                            >
                                                <Chip
                                                    size="small"
                                                    label={`${tour.durationDays}N${tour.durationNights}Đ`}
                                                    color="primary"
                                                    variant="outlined"
                                                />

                                                <Button
                                                    component={Link}
                                                    to={`/tours/${tour.slug}`}
                                                    size="small"
                                                    variant="contained"
                                                >
                                                    Xem tour
                                                </Button>
                                            </Stack>
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))
                        ) : (
                            <Grid size={{ xs: 12 }}>
                                <Typography color="text.secondary">
                                    Chưa có tour liên quan tại điểm đến này.
                                </Typography>
                            </Grid>
                        )}
                    </Grid>
                </Box>
            </Stack>
        </Container>
    );
}