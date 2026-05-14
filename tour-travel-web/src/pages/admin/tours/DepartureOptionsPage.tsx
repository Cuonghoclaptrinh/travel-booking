import { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useNavigate, useParams } from 'react-router-dom';
import departureOptionService, {
    CreateDepartureOptionPayload,
} from '../../../services/admin/departureOptionService';
import { DepartureOption } from '../../../types/departure-option';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import AirportShuttleIcon from '@mui/icons-material/AirportShuttle';
import FlightIcon from '@mui/icons-material/Flight';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';

const GOLD = '#c9a84c';
const GOLD_DARK = '#a8842f';
const DARK = '#1f2937';
const MUTED = '#6b7280';
const BORDER = 'rgba(0,0,0,0.08)';
const SURFACE = '#ffffff';
const SOFT_BG = '#f8fafc';

const transportLabels: Record<string, string> = {
    bus: 'Xe khách',
    limousine: 'Limousine',
    flight: 'Máy bay',
    self_arrival: 'Tự túc',
};

const transportIcons: Record<string, React.ReactNode> = {
    bus: <DirectionsBusIcon fontSize="small" />,
    limousine: <AirportShuttleIcon fontSize="small" />,
    flight: <FlightIcon fontSize="small" />,
    self_arrival: <DirectionsWalkIcon fontSize="small" />,
};

const defaultForm: CreateDepartureOptionPayload = {
    departureCity: '',
    transportType: 'bus',
    extraPrice: 0,
    meetingPoint: '',
    startTime: '',
    endTime: '',
    notes: '',
    status: 'active',
};

export default function DepartureOptionsPage() {
    const navigate = useNavigate();
    const { departureId } = useParams();

    const [items, setItems] = useState<DepartureOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [editingItem, setEditingItem] = useState<DepartureOption | null>(null);
    const [form, setForm] = useState<CreateDepartureOptionPayload>(defaultForm);

    const currentDepartureId = Number(departureId);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await departureOptionService.getByDepartureId(currentDepartureId);
            setItems(data || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentDepartureId) fetchData();
    }, [currentDepartureId]);

    const resetForm = () => {
        setForm(defaultForm);
        setEditingItem(null);
    };

    const handleOpenCreate = () => {
        resetForm();
        setOpenModal(true);
    };

    const handleOpenEdit = (item: DepartureOption) => {
        setEditingItem(item);
        setForm({
            departureCity: item.departureCity,
            transportType: item.transportType,
            extraPrice: Number(item.extraPrice || 0),
            meetingPoint: item.meetingPoint || '',
            startTime: item.startTime?.slice(0, 16) || '',
            endTime: item.endTime?.slice(0, 16) || '',
            notes: item.notes || '',
            status: item.status,
        });
        setOpenModal(true);
    };

    const handleSubmit = async () => {
        if (editingItem) {
            await departureOptionService.update(currentDepartureId, editingItem.id, form);
        } else {
            await departureOptionService.create(currentDepartureId, form);
        }

        setOpenModal(false);
        resetForm();
        fetchData();
    };

    const handleDelete = async (optionId: number) => {
        const ok = window.confirm('Bạn có chắc muốn xóa option này không?');
        if (!ok) return;

        await departureOptionService.remove(currentDepartureId, optionId);
        fetchData();
    };

    const columns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 80 },

        {
            field: 'departureCity',
            headerName: 'Điểm đi',
            minWidth: 160,
            flex: 0.8,
        },

        {
            field: 'transportType',
            headerName: 'Phương tiện',
            width: 160,
            renderCell: (params) => {
                const value = params.value as string;

                return (
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                        <Box sx={{ color: GOLD_DARK, display: 'flex', alignItems: 'center' }}>
                            {transportIcons[value] || <DirectionsBusIcon fontSize="small" />}
                        </Box>
                        <Typography fontSize="0.9rem" fontWeight={600} color={DARK}>
                            {transportLabels[value] || value}
                        </Typography>
                    </Stack>
                );
            },
        },

        {
            field: 'extraPrice',
            headerName: 'Phụ thu',
            width: 130,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => (
                <Typography fontSize="0.9rem" fontWeight={700} color={Number(params.row.extraPrice) > 0 ? '#c2410c' : MUTED}>
                    {Number(params.row.extraPrice).toLocaleString('vi-VN')} đ
                </Typography>
            ),
        },

        {
            field: 'meetingPoint',
            headerName: 'Điểm hẹn',
            flex: 1,
            minWidth: 220,
            renderCell: (params) => (
                <Typography fontSize="0.9rem" color={params.value ? DARK : MUTED}>
                    {params.value || 'Chưa cập nhật'}
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
                        label={isActive ? 'Đang áp dụng' : 'Tạm ẩn'}
                        sx={{
                            bgcolor: isActive ? '#ecfdf5' : '#f3f4f6',
                            color: isActive ? '#047857' : '#6b7280',
                            fontWeight: 700,
                            border: `1px solid ${isActive ? '#a7f3d0' : '#e5e7eb'}`,
                        }}
                    />
                );
            },
        },

        {
            field: 'actions',
            headerName: 'Thao tác',
            width: 110,
            sortable: false,
            filterable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Stack direction="row" spacing={0.5} alignItems="center">
                    <Tooltip title="Sửa tùy chọn">
                        <IconButton
                            size="small"
                            onClick={() => handleOpenEdit(params.row)}
                            sx={{
                                color: '#2563eb',
                                bgcolor: '#eff6ff',
                                '&:hover': { bgcolor: '#dbeafe' },
                            }}
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Xóa tùy chọn">
                        <IconButton
                            size="small"
                            onClick={() => handleDelete(params.row.id)}
                            sx={{
                                color: '#dc2626',
                                bgcolor: '#fef2f2',
                                '&:hover': { bgcolor: '#fee2e2' },
                            }}
                        >
                            <DeleteOutlineIcon fontSize="small" />
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
                            <SettingsIcon />
                        </Box>

                        <Box>
                            <Typography
                                sx={{
                                    fontSize: { xs: '1.35rem', md: '1.75rem' },
                                    fontWeight: 800,
                                    color: DARK,
                                }}
                            >
                                Quản lý tùy chọn khởi hành
                            </Typography>

                            <Typography fontSize="0.9rem" color={MUTED}>
                                Danh sách điểm đi và phương tiện của lịch khởi hành #{currentDepartureId}
                            </Typography>
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBackIcon />}
                            onClick={() => navigate(-1)}
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
                            Thêm tùy chọn
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

            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, color: DARK }}>
                    {editingItem ? 'Chỉnh sửa tùy chọn khởi hành' : 'Thêm tùy chọn khởi hành'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        <TextField
                            label="Điểm đi"
                            value={form.departureCity}
                            onChange={(e) => setForm({ ...form, departureCity: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            select
                            label="Phương tiện"
                            value={form.transportType}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    transportType: e.target.value as CreateDepartureOptionPayload['transportType'],
                                })
                            }
                            fullWidth
                        >
                            <MenuItem value="bus">Xe khách</MenuItem>
                            <MenuItem value="limousine">Limousine</MenuItem>
                            <MenuItem value="flight">Máy bay</MenuItem>
                            <MenuItem value="self_arrival">Tự túc</MenuItem>
                        </TextField>
                        <TextField
                            label="Phụ thu"
                            type="number"
                            value={form.extraPrice}
                            onChange={(e) => setForm({ ...form, extraPrice: Number(e.target.value) })}
                            fullWidth
                        />
                        <TextField
                            label="Điểm hẹn"
                            value={form.meetingPoint}
                            onChange={(e) => setForm({ ...form, meetingPoint: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            label="Giờ bắt đầu"
                            type="datetime-local"
                            value={form.startTime}
                            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Giờ kết thúc"
                            type="datetime-local"
                            value={form.endTime}
                            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Ghi chú"
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            fullWidth
                            multiline
                            minRows={3}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button
                        onClick={() => setOpenModal(false)}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 700,
                            color: MUTED,
                        }}
                    >
                        Hủy
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 700,
                            bgcolor: GOLD,
                            '&:hover': {
                                bgcolor: GOLD_DARK,
                            },
                        }}
                    >
                        Lưu
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
}