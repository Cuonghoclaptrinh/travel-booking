import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    FormControlLabel,
    Grid,
    IconButton,
    MenuItem,
    Paper,
    Stack,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useNavigate, useParams } from 'react-router-dom';
import tourService from '../../../services/admin/tourService';
import { CreateTourPayload, featureOptions, Tour, tourTypeOptions } from '../../../types/tour';
import tourImageService, { TourImage } from '../../../services/admin/tourImageService';

const defaultForm: CreateTourPayload = {
    destinationId: 1,
    name: '',
    slug: '',
    shortDescription: '',
    description: '',
    durationDays: 1,
    durationNights: 0,
    coverImageUrl: '',
    highlights: '',
    includedServices: '',
    excludedServices: '',
    termsAndConditions: '',
    isFeatured: false,
    isHotDeal: false,
};

const generateSlug = (text: string) => {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
};


export default function TourFormPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [currentImageUrl, setCurrentImageUrl] = useState('');
    const [form, setForm] = useState<CreateTourPayload>(defaultForm);

    const [galleryImages, setGalleryImages] = useState<TourImage[]>([]);
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    const [galleryUploading, setGalleryUploading] = useState(false);
    const [galleryLoading, setGalleryLoading] = useState(false);

    useEffect(() => {
        if (!isEdit) return;

        const fetchDetail = async () => {
            try {
                setLoading(true);
                setError('');

                const data: Tour = await tourService.getById(Number(id));
                setForm({
                    destinationId: data.destinationId,
                    name: data.name,
                    slug: data.slug,
                    shortDescription: data.shortDescription || '',
                    description: data.description || '',
                    durationDays: data.durationDays,
                    durationNights: data.durationNights,
                    // coverImageUrl: data.coverImageUrl || '',
                    highlights: data.highlights || '',
                    includedServices: data.includedServices || '',
                    excludedServices: data.excludedServices || '',
                    termsAndConditions: data.termsAndConditions || '',
                    tourType: data.tourType || '',
                    featureTags: data.featureTags || [],
                    isFeatured: Boolean(data.isFeatured),
                    isHotDeal: Boolean(data.isHotDeal),
                });
                // setCurrentImageUrl(data.coverImageUrl || '');
                await fetchGalleryImages(Number(id));
            } catch {
                setError('Không tải được dữ liệu tour');
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [id, isEdit]);

    const handleDeleteGalleryImage = async (imageId: number) => {
        if (!id) return;

        const ok = window.confirm('Bạn có chắc muốn xóa ảnh này không?');
        if (!ok) return;

        try {
            setError('');
            await tourImageService.remove(Number(id), imageId);
            await fetchGalleryImages(Number(id));
        } catch {
            setError('Xóa ảnh thất bại');
        }
    };

    const handleSetDefaultGalleryImage = async (imageId: number) => {
        if (!id) return;

        try {
            setError('');
            await tourImageService.setDefault(Number(id), imageId);
            await fetchGalleryImages(Number(id));
        } catch {
            setError('Đặt ảnh mặc định thất bại');
        }
    };

    const handleGalleryFilesChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const files = Array.from(event.target.files || []);
        setGalleryFiles(files);
    };

    const handleUploadGallery = async () => {
        if (!id || galleryFiles.length === 0) return;

        try {
            setGalleryUploading(true);
            setError('');

            await tourImageService.uploadMany(Number(id), galleryFiles);
            setGalleryFiles([]);
            await fetchGalleryImages(Number(id));
        } catch {
            setError('Upload ảnh tour thất bại');
        } finally {
            setGalleryUploading(false);
        }
    };

    const fetchGalleryImages = async (tourId: number) => {
        try {
            setGalleryLoading(true);
            const data = await tourImageService.getByTourId(tourId);
            setGalleryImages(data || []);
        } catch {
            setError('Không tải được danh sách ảnh tour');
        } finally {
            setGalleryLoading(false);
        }
    };

    // const handleChange =
    //     (field: keyof CreateTourPayload) =>
    //         (event: React.ChangeEvent<HTMLInputElement>) => {
    //             const value = event.target.value;
    //             setForm((prev) => ({
    //                 ...prev,
    //                 [field]:
    //                     field === 'destinationId' ||
    //                         field === 'durationDays' ||
    //                         field === 'durationNights'
    //                         ? Number(value)
    //                         : value,
    //             }));
    //         };
    const handleChange =
        (field: keyof CreateTourPayload) =>
            (event: React.ChangeEvent<HTMLInputElement>) => {
                const value = event.target.value;

                setForm((prev) => {
                    const nextValue =
                        field === 'destinationId' ||
                            field === 'durationDays' ||
                            field === 'durationNights'
                            ? Number(value)
                            : value;

                    const nextForm = {
                        ...prev,
                        [field]: nextValue,
                    };

                    if (field === 'name') {
                        nextForm.slug = generateSlug(value);
                    }

                    if (field === 'slug') {
                        nextForm.slug = generateSlug(value);
                    }

                    return nextForm;
                });
            };
            
    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        setImageFile(file);
    };

    const handleFeatureTagsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;

        setForm((prev) => ({
            ...prev,
            featureTags:
                typeof value === 'string'
                    ? value.split(',').filter(Boolean)
                    : value,
        }));
    };

    const previewImageUrl = useMemo(() => {
        if (imageFile) {
            return URL.createObjectURL(imageFile);
        }

        return currentImageUrl || '';
    }, [imageFile, currentImageUrl]);

    useEffect(() => {
        return () => {
            if (imageFile && previewImageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewImageUrl);
            }
        };
    }, [imageFile, previewImageUrl]);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError('');

            if (isEdit) {
                await tourService.update(Number(id), form, imageFile);
            } else {
                await tourService.create(form, imageFile);
            }

            navigate('/admin/tours');
        } catch {
            setError('Lưu tour thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Stack spacing={3}>
            <Typography variant="h4">
                {isEdit ? 'Chỉnh sửa Tour' : 'Tạo Tour'}
            </Typography>

            {error && <Alert severity="error">{error}</Alert>}

            <Paper sx={{ p: 3 }}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Tên tour"
                            value={form.name}
                            onChange={handleChange('name')}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Slug"
                            value={form.slug}
                            onChange={handleChange('slug')}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Destination ID"
                            value={form.destinationId}
                            onChange={handleChange('destinationId')}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Số ngày"
                            value={form.durationDays}
                            onChange={handleChange('durationDays')}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Số đêm"
                            value={form.durationNights}
                            onChange={handleChange('durationNights')}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            select
                            fullWidth
                            label="Loại tour / Dòng tour"
                            value={form.tourType || ''}
                            onChange={handleChange('tourType')}
                        >
                            <MenuItem value="">Chưa chọn</MenuItem>
                            {tourTypeOptions.map((item) => (
                                <MenuItem key={item.value} value={item.value}>
                                    {item.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            select
                            fullWidth
                            label="Thể loại / Đặc điểm tour"
                            value={form.featureTags || []}
                            onChange={handleFeatureTagsChange}
                            SelectProps={{
                                multiple: true,
                            }}
                        >
                            {featureOptions.map((item) => (
                                <MenuItem key={item.value} value={item.value}>
                                    {item.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                height: '100%',
                            }}
                        >
                            <Stack spacing={1}>
                                <Typography fontWeight={700}>
                                    Hiển thị trên trang chủ
                                </Typography>

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={Boolean(form.isFeatured)}
                                            onChange={(event) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    isFeatured: event.target.checked,
                                                }))
                                            }
                                        />
                                    }
                                    label="Tour nổi bật"
                                />

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={Boolean(form.isHotDeal)}
                                            onChange={(event) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    isHotDeal: event.target.checked,
                                                }))
                                            }
                                        />
                                    }
                                    label="Combo giá tốt"
                                />
                            </Stack>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            label="Mô tả ngắn"
                            value={form.shortDescription}
                            onChange={handleChange('shortDescription')}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Stack spacing={1}>
                            <Button variant="outlined" component="label">
                                Chọn ảnh cover
                                <input
                                    hidden
                                    accept="image/*"
                                    type="file"
                                    onChange={handleImageChange}
                                />
                            </Button>

                            {imageFile && (
                                <Typography variant="body2">
                                    Ảnh đã chọn: {imageFile.name}
                                </Typography>
                            )}

                            {previewImageUrl && (
                                <Stack spacing={1}>
                                    <Typography variant="body2">
                                        Xem trước ảnh:
                                    </Typography>
                                    <img
                                        src={previewImageUrl}
                                        alt="Tour cover"
                                        style={{
                                            width: 240,
                                            maxWidth: '100%',
                                            height: 160,
                                            objectFit: 'cover',
                                            borderRadius: 8,
                                            border: '1px solid #ddd',
                                        }}
                                    />
                                </Stack>
                            )}
                            {isEdit && (
                                <Grid size={{ xs: 12 }}>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            borderRadius: 2,
                                            bgcolor: '#fafafa',
                                        }}
                                    >
                                        <Stack spacing={2}>
                                            <Box>
                                                <Typography variant="h6" fontWeight={700}>
                                                    Ảnh tour / Gallery
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Có thể thêm nhiều ảnh để hiển thị ở trang chi tiết tour.
                                                </Typography>
                                            </Box>

                                            <Stack
                                                direction={{ xs: 'column', sm: 'row' }}
                                                spacing={1.5}
                                                alignItems={{ xs: 'stretch', sm: 'center' }}
                                            >
                                                <Button variant="outlined" component="label">
                                                    Chọn nhiều ảnh
                                                    <input
                                                        hidden
                                                        multiple
                                                        accept="image/*"
                                                        type="file"
                                                        onChange={handleGalleryFilesChange}
                                                    />
                                                </Button>

                                                <Button
                                                    variant="contained"
                                                    onClick={handleUploadGallery}
                                                    disabled={galleryUploading || galleryFiles.length === 0}
                                                >
                                                    {galleryUploading ? 'Đang upload...' : 'Upload ảnh tour'}
                                                </Button>
                                            </Stack>

                                            {galleryFiles.length > 0 && (
                                                <Stack spacing={0.5}>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        Ảnh chuẩn bị upload:
                                                    </Typography>
                                                    {galleryFiles.map((file) => (
                                                        <Typography key={file.name} variant="body2" color="text.secondary">
                                                            • {file.name}
                                                        </Typography>
                                                    ))}
                                                </Stack>
                                            )}

                                            {galleryLoading ? (
                                                <Typography variant="body2" color="text.secondary">
                                                    Đang tải danh sách ảnh...
                                                </Typography>
                                            ) : galleryImages.length === 0 ? (
                                                <Typography variant="body2" color="text.secondary">
                                                    Chưa có ảnh gallery nào.
                                                </Typography>
                                            ) : (
                                                <Box
                                                    sx={{
                                                        display: 'grid',
                                                        gridTemplateColumns: {
                                                            xs: '1fr 1fr',
                                                            sm: '1fr 1fr 1fr',
                                                            md: '1fr 1fr 1fr 1fr',
                                                        },
                                                        gap: 2,
                                                    }}
                                                >
                                                    {galleryImages.map((image) => (
                                                        <Paper
                                                            key={image.id}
                                                            variant="outlined"
                                                            sx={{
                                                                p: 1,
                                                                borderRadius: 2,
                                                                overflow: 'hidden',
                                                            }}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    width: '100%',
                                                                    height: 140,
                                                                    borderRadius: 1.5,
                                                                    overflow: 'hidden',
                                                                    mb: 1,
                                                                    border: '1px solid #e5e7eb',
                                                                }}
                                                            >
                                                                <img
                                                                    src={image.url}
                                                                    alt="Tour gallery"
                                                                    style={{
                                                                        width: '100%',
                                                                        height: '100%',
                                                                        objectFit: 'cover',
                                                                        display: 'block',
                                                                    }}
                                                                />
                                                            </Box>

                                                            <Stack
                                                                direction="row"
                                                                justifyContent="space-between"
                                                                alignItems="center"
                                                                spacing={1}
                                                            >
                                                                {image.isDefault ? (
                                                                    <Chip
                                                                        size="small"
                                                                        color="warning"
                                                                        label="Mặc định"
                                                                    />
                                                                ) : (
                                                                    <Button
                                                                        size="small"
                                                                        startIcon={<StarBorderIcon />}
                                                                        onClick={() =>
                                                                            handleSetDefaultGalleryImage(image.id)
                                                                        }
                                                                    >
                                                                        Mặc định
                                                                    </Button>
                                                                )}

                                                                <IconButton
                                                                    color="error"
                                                                    onClick={() =>
                                                                        handleDeleteGalleryImage(image.id)
                                                                    }
                                                                >
                                                                    <DeleteOutlineIcon />
                                                                </IconButton>
                                                            </Stack>
                                                        </Paper>
                                                    ))}
                                                </Box>
                                            )}
                                        </Stack>
                                    </Paper>
                                </Grid>
                            )}
                        </Stack>
                    </Grid>


                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            multiline
                            minRows={4}
                            label="Mô tả chi tiết"
                            value={form.description}
                            onChange={handleChange('description')}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            multiline
                            minRows={3}
                            label="Highlights"
                            value={form.highlights}
                            onChange={handleChange('highlights')}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            multiline
                            minRows={3}
                            label="Included Services"
                            value={form.includedServices}
                            onChange={handleChange('includedServices')}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            multiline
                            minRows={3}
                            label="Excluded Services"
                            value={form.excludedServices}
                            onChange={handleChange('excludedServices')}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            multiline
                            minRows={3}
                            label="Terms & Conditions"
                            value={form.termsAndConditions}
                            onChange={handleChange('termsAndConditions')}
                        />
                    </Grid>
                </Grid>

                <Stack direction="row" justifyContent="flex-end" spacing={2} mt={3}>
                    <Button variant="outlined" onClick={() => navigate('/admin/tours')}>
                        Quay lại
                    </Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Đang lưu...' : 'Lưu'}
                    </Button>
                </Stack>
            </Paper>
        </Stack>
    );
}
