import { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    Menu,
    MenuItem,
    Paper,
    Stack,
    Switch,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useNavigate, useParams } from 'react-router-dom';
import tourPackageService, {
    CreateTourPackagePayload,
} from '../../../services/admin/tourPackageService';
import { TourPackage } from '../../../types/tour-package';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import StarIcon from '@mui/icons-material/Star';
import Inventory2Icon from '@mui/icons-material/Inventory2';

const GOLD = '#c9a84c';
const GOLD_DARK = '#a8842f';
const DARK = '#1f2937';
const MUTED = '#6b7280';
const BORDER = 'rgba(0,0,0,0.08)';
const SURFACE = '#ffffff';
const SOFT_BG = '#f8fafc';

const defaultForm: CreateTourPackagePayload = {
    name: '',
    code: '',
    description: '',
    priceAdult: 0,
    priceChild: 0,
    hotelName: '',
    hotelStandard: '',
    hotelAddress: '',
    hotelDescription: '',
    roomType: '',
    mealsIncluded: '',
    allowGuideOption: false,
    guideExtraPrice: 0,
    isDefault: false,
    sortOrder: 0,
    status: 'active',
};

export default function TourPackagesPage() {
    const navigate = useNavigate();
    const { tourId } = useParams();

    const [items, setItems] = useState<TourPackage[]>([]);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [editingItem, setEditingItem] = useState<TourPackage | null>(null);
    const [form, setForm] = useState<CreateTourPackagePayload>(defaultForm);
    const [actionMenuAnchor, setActionMenuAnchor] = useState<HTMLElement | null>(null);
    const [selectedActionRow, setSelectedActionRow] = useState<TourPackage | null>(null);

    const openActionMenu = Boolean(actionMenuAnchor);

    const handleOpenActionMenu = (
        event: React.MouseEvent<HTMLElement>,
        row: TourPackage,
    ) => {
        setActionMenuAnchor(event.currentTarget);
        setSelectedActionRow(row);
    };

    const handleCloseActionMenu = () => {
        setActionMenuAnchor(null);
        setSelectedActionRow(null);
    };

    const currentTourId = Number(tourId);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await tourPackageService.getByTourId(currentTourId);
            setItems(data || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentTourId) fetchData();
    }, [currentTourId]);

    const resetForm = () => {
        setForm(defaultForm);
        setEditingItem(null);
    };

    const handleOpenCreate = () => {
        resetForm();
        setOpenModal(true);
    };

    const handleOpenEdit = (item: TourPackage) => {
        setEditingItem(item);
        setForm({
            name: item.name,
            code: item.code,
            description: item.description || '',
            priceAdult: Number(item.priceAdult),
            priceChild: Number(item.priceChild),
            discountPercent: Number(item.discountPercent || 0),
            hotelName: item.hotelName || '',
            hotelStandard: item.hotelStandard || '',
            hotelAddress: item.hotelAddress || '',
            hotelDescription: item.hotelDescription || '',
            roomType: item.roomType || '',
            mealsIncluded: item.mealsIncluded || '',
            allowGuideOption: item.allowGuideOption,
            guideExtraPrice: Number(item.guideExtraPrice || 0),
            isDefault: item.isDefault,
            sortOrder: item.sortOrder,
            status: item.status,
        });
        setOpenModal(true);
    };

    const handleSubmit = async () => {
        if (editingItem) {
            await tourPackageService.update(currentTourId, editingItem.id, form);
        } else {
            await tourPackageService.create(currentTourId, form);
        }

        setOpenModal(false);
        resetForm();
        fetchData();
    };

    const handleDelete = async (packageId: number) => {
        const ok = window.confirm('Bạn có chắc muốn xóa package này không?');
        if (!ok) return;

        await tourPackageService.remove(currentTourId, packageId);
        fetchData();
    };

    const handleSetDefault = async (packageId: number) => {
        await tourPackageService.setDefault(currentTourId, packageId);
        fetchData();
    };

    const columns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 80 },
        { field: 'name', headerName: 'Tên gói', flex: 1, minWidth: 180 },
        { field: 'code', headerName: 'Code', width: 120 },
        {
            field: 'priceAdult',
            headerName: 'Giá người lớn',
            width: 140,
            renderCell: (params) => (
                <span>{Number(params.row.priceAdult).toLocaleString('vi-VN')} đ</span>
            ),
        },
        {
            field: 'priceChild',
            headerName: 'Giá trẻ em',
            width: 140,
            renderCell: (params) => (
                <span>{Number(params.row.priceChild).toLocaleString('vi-VN')} đ</span>
            ),
        },
        {
            field: 'discountPercent',
            headerName: 'Giảm giá',
            width: 120,
            renderCell: (params) => {
                const discount = Number(params.row.discountPercent || 0);

                return (
                    <Chip
                        size="small"
                        label={`${discount}%`}
                        color={discount > 0 ? 'error' : 'default'}
                        variant={discount > 0 ? 'filled' : 'outlined'}
                    />
                );
            },
        },
        {
            field: 'isDefault',
            headerName: 'Mặc định',
            width: 120,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) =>
                params.value ? (
                    <Chip
                        size="small"
                        icon={<StarIcon sx={{ fontSize: 16 }} />}
                        label="Mặc định"
                        sx={{
                            bgcolor: '#ecfdf5',
                            color: '#047857',
                            fontWeight: 700,
                            border: '1px solid #a7f3d0',
                            '& .MuiChip-icon': {
                                color: '#047857',
                            },
                        }}
                    />
                ) : (
                    <Typography fontSize="0.85rem" color={MUTED}>
                        —
                    </Typography>
                ),
        },
        {
            field: 'status',
            headerName: 'Trạng thái',
            width: 130,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => {
                const isActive = params.value === 'active';

                return (
                    <Chip
                        size="small"
                        label={isActive ? 'Đang bán' : 'Tạm ẩn'}
                        sx={{
                            bgcolor: isActive ? '#eff6ff' : '#f3f4f6',
                            color: isActive ? '#1d4ed8' : '#6b7280',
                            fontWeight: 700,
                            border: `1px solid ${isActive ? '#bfdbfe' : '#e5e7eb'}`,
                        }}
                    />
                );
            },
        },
        {
            field: 'actions',
            headerName: 'Thao tác',
            width: 130,
            sortable: false,
            filterable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Stack direction="row" spacing={0.5} alignItems="center">
                    <Tooltip title="Sửa gói tour">
                        <IconButton
                            size="small"
                            onClick={() => handleOpenEdit(params.row)}
                            sx={{
                                color: '#2563eb',
                                bgcolor: '#eff6ff',
                                '&:hover': {
                                    bgcolor: '#dbeafe',
                                },
                            }}
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Xóa gói tour">
                        <IconButton
                            size="small"
                            onClick={() => handleDelete(params.row.id)}
                            sx={{
                                color: '#dc2626',
                                bgcolor: '#fef2f2',
                                '&:hover': {
                                    bgcolor: '#fee2e2',
                                },
                            }}
                        >
                            <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Thao tác khác">
                        <IconButton
                            size="small"
                            onClick={(event) => handleOpenActionMenu(event, params.row)}
                            sx={{
                                color: DARK,
                                bgcolor: '#f3f4f6',
                                '&:hover': {
                                    bgcolor: '#e5e7eb',
                                },
                            }}
                        >
                            <MoreVertIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            ),
        },
    ];

    return (
        <Stack spacing={3}>
            <Paper
                sx={{
                    p: 2.5,
                    borderRadius: 4,
                    border: `1px solid ${BORDER}`,
                    boxShadow: '0 4px 20px rgba(15,23,42,0.06)',
                    bgcolor: SURFACE,
                }}
            >
                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', md: 'center' }}
                    spacing={2}
                >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                            sx={{
                                width: 44,
                                height: 44,
                                borderRadius: 3,
                                bgcolor: '#fff7ed',
                                color: GOLD_DARK,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Inventory2Icon />
                        </Box>

                        <Box>
                            <Typography
                                sx={{
                                    fontSize: { xs: '1.35rem', md: '1.75rem' },
                                    fontWeight: 800,
                                    color: DARK,
                                }}
                            >
                                Quản lý gói tour
                            </Typography>

                            <Typography fontSize="0.9rem" color={MUTED}>
                                Danh sách gói dịch vụ của tour #{currentTourId}
                            </Typography>
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBackIcon />}
                            onClick={() => navigate('/admin/tours')}
                            sx={{
                                borderRadius: 2.5,
                                color: DARK,
                                borderColor: BORDER,
                                textTransform: 'none',
                                fontWeight: 700,
                            }}
                        >
                            Quay lại
                        </Button>

                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleOpenCreate}
                            sx={{
                                borderRadius: 2.5,
                                bgcolor: GOLD,
                                textTransform: 'none',
                                fontWeight: 700,
                                boxShadow: '0 6px 18px rgba(201,168,76,0.28)',
                                '&:hover': {
                                    bgcolor: GOLD_DARK,
                                },
                            }}
                        >
                            Thêm gói tour
                        </Button>
                    </Stack>
                </Stack>
            </Paper>

            <Paper
                sx={{
                    height: 600,
                    borderRadius: 4,
                    overflow: 'hidden',
                    border: `1px solid ${BORDER}`,
                    boxShadow: '0 4px 20px rgba(15,23,42,0.06)',
                }}
            >
                <Box sx={{ height: '100%' }}>
                    <DataGrid
                        rows={items}
                        columns={columns}
                        loading={loading}
                        disableRowSelectionOnClick
                        sx={{
                            border: 0,
                            bgcolor: SURFACE,
                            '& .MuiDataGrid-columnHeaders': {
                                bgcolor: SOFT_BG,
                                color: DARK,
                                fontWeight: 800,
                                borderBottom: `1px solid ${BORDER}`,
                            },
                            '& .MuiDataGrid-columnHeaderTitle': {
                                fontWeight: 800,
                            },
                            '& .MuiDataGrid-row:hover': {
                                bgcolor: '#fffbeb',
                            },
                            '& .MuiDataGrid-cell': {
                                borderBottom: '1px solid rgba(0,0,0,0.04)',
                                display: 'flex',
                                alignItems: 'center',
                            },
                            '& .MuiDataGrid-cell:focus': {
                                outline: 'none',
                            },
                            '& .MuiDataGrid-cell:focus-within': {
                                outline: 'none',
                            },
                            '& .MuiDataGrid-columnHeader:focus': {
                                outline: 'none',
                            },
                            '& .MuiDataGrid-columnHeader:focus-within': {
                                outline: 'none',
                            },
                        }}
                    />
                </Box>
            </Paper>

            <Menu
                anchorEl={actionMenuAnchor}
                open={openActionMenu}
                onClose={handleCloseActionMenu}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        minWidth: 190,
                        boxShadow: '0 12px 32px rgba(15,23,42,0.16)',
                        border: `1px solid ${BORDER}`,
                    },
                }}
            >
                <MenuItem
                    disabled={!selectedActionRow || selectedActionRow.isDefault}
                    onClick={async () => {
                        if (!selectedActionRow) return;
                        await handleSetDefault(selectedActionRow.id);
                        handleCloseActionMenu();
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1.25}>
                        <StarIcon fontSize="small" sx={{ color: GOLD }} />
                        <span>Đặt làm mặc định</span>
                    </Stack>
                </MenuItem>
            </Menu>

            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, color: DARK }}>
                    {editingItem ? 'Chỉnh sửa gói tour' : 'Thêm gói tour'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        <TextField
                            label="Tên gói"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            label="Code"
                            value={form.code}
                            onChange={(e) => setForm({ ...form, code: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            label="Giá người lớn"
                            type="number"
                            value={form.priceAdult}
                            onChange={(e) => setForm({ ...form, priceAdult: Number(e.target.value) })}
                            fullWidth
                        />
                        <TextField
                            label="Giá trẻ em"
                            type="number"
                            value={form.priceChild}
                            onChange={(e) => setForm({ ...form, priceChild: Number(e.target.value) })}
                            fullWidth
                        />
                        <TextField
                            label="Giảm giá (%)"
                            type="number"
                            value={form.discountPercent || 0}
                            onChange={(e) => {
                                const value = Number(e.target.value);

                                setForm({
                                    ...form,
                                    discountPercent: Math.max(0, Math.min(100, value)),
                                });
                            }}
                            fullWidth
                            inputProps={{
                                min: 0,
                                max: 100,
                            }}
                            helperText={
                                form.discountPercent && form.discountPercent > 0
                                    ? `Giá người lớn sau giảm: ${Math.round(
                                        (Number(form.priceAdult || 0) * (100 - Number(form.discountPercent || 0))) / 100,
                                    ).toLocaleString('vi-VN')} đ`
                                    : 'Nhập 0 nếu package không giảm giá'
                            }
                        />
                        <TextField
                            label="Tên khách sạn"
                            value={form.hotelName}
                            onChange={(e) => setForm({ ...form, hotelName: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            label="Tiêu chuẩn khách sạn"
                            value={form.hotelStandard}
                            onChange={(e) => setForm({ ...form, hotelStandard: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            label="Loại phòng"
                            value={form.roomType}
                            onChange={(e) => setForm({ ...form, roomType: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            label="Bữa ăn bao gồm"
                            value={form.mealsIncluded}
                            onChange={(e) => setForm({ ...form, mealsIncluded: e.target.value })}
                            fullWidth
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={form.allowGuideOption || false}
                                    onChange={(e) =>
                                        setForm({ ...form, allowGuideOption: e.target.checked })
                                    }
                                />
                            }
                            label="Cho phép chọn guide riêng"
                        />
                        <TextField
                            label="Phụ phí guide"
                            type="number"
                            value={form.guideExtraPrice}
                            onChange={(e) => setForm({ ...form, guideExtraPrice: Number(e.target.value) })}
                            fullWidth
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={form.isDefault || false}
                                    onChange={(e) =>
                                        setForm({ ...form, isDefault: e.target.checked })
                                    }
                                />
                            }
                            label="Là package mặc định"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenModal(false)}>Hủy</Button>
                    <Button variant="contained" onClick={handleSubmit}>
                        Lưu
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
}