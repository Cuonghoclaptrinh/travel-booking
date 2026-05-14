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
    Menu,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useNavigate, useParams } from 'react-router-dom';
import tourDepartureService, {
    CreateTourDeparturePayload,
} from '../../../services/admin/tourDepartureService';
import { TourDeparture } from '../../../types/tour-departure';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EventNoteIcon from '@mui/icons-material/EventNote';
import SettingsIcon from '@mui/icons-material/Settings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import LockIcon from '@mui/icons-material/Lock';
import CancelIcon from '@mui/icons-material/Cancel';

const GOLD = '#c9a84c';
const GOLD_DARK = '#a8842f';
const DARK = '#1f2937';
const MUTED = '#6b7280';
const BORDER = 'rgba(0,0,0,0.08)';
const SURFACE = '#ffffff';
const SOFT_BG = '#f8fafc';

const defaultForm: CreateTourDeparturePayload = {
    code: '',
    departureDate: '',
    returnDate: '',
    registrationDeadline: '',
    capacity: 1,
    basePriceAdjustment: 0,
    status: 'draft',
    notes: '',
};

export default function TourDeparturesPage() {
    const navigate = useNavigate();
    const { tourId } = useParams();

    const [items, setItems] = useState<TourDeparture[]>([]);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [editingItem, setEditingItem] = useState<TourDeparture | null>(null);
    const [form, setForm] = useState<CreateTourDeparturePayload>(defaultForm);

    const [actionMenuAnchor, setActionMenuAnchor] = useState<HTMLElement | null>(null);
    const [selectedActionRow, setSelectedActionRow] = useState<TourDeparture | null>(null);

    const openActionMenu = Boolean(actionMenuAnchor);

    const handleOpenActionMenu = (
        event: React.MouseEvent<HTMLElement>,
        row: TourDeparture,
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
            const data = await tourDepartureService.getByTourId(currentTourId);
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

    const handleOpenEdit = (item: TourDeparture) => {
        setEditingItem(item);
        setForm({
            code: item.code,
            departureDate: item.departureDate?.slice(0, 16) || '',
            returnDate: item.returnDate?.slice(0, 16) || '',
            registrationDeadline: item.registrationDeadline?.slice(0, 16) || '',
            capacity: item.capacity,
            basePriceAdjustment: Number(item.basePriceAdjustment || 0),
            status: item.status,
            notes: item.notes || '',
            staffInChargeId: item.staffInChargeId || 0,
        });
        setOpenModal(true);
    };

    const handleSubmit = async () => {
        if (editingItem) {
            await tourDepartureService.update(currentTourId, editingItem.id, form);
        } else {
            await tourDepartureService.create(currentTourId, form);
        }

        setOpenModal(false);
        resetForm();
        fetchData();
    };

    const handleDelete = async (departureId: number) => {
        const ok = window.confirm('Bạn có chắc muốn xóa departure này không?');
        if (!ok) return;

        await tourDepartureService.remove(currentTourId, departureId);
        fetchData();
    };

    const handleOpenStatus = async (departureId: number) => {
        await tourDepartureService.open(currentTourId, departureId);
        fetchData();
    };

    const handleCloseStatus = async (departureId: number) => {
        await tourDepartureService.close(currentTourId, departureId);
        fetchData();
    };

    const handleCancelStatus = async (departureId: number) => {
        await tourDepartureService.cancel(currentTourId, departureId);
        fetchData();
    };

    const columns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 80 },
        { field: 'code', headerName: 'Mã lịch', width: 130 },

        {
            field: 'departureDate',
            headerName: 'Ngày đi',
            width: 180,
            valueFormatter: (value) => value ? new Date(value as string).toLocaleString('vi-VN') : '—',
        },

        {
            field: 'returnDate',
            headerName: 'Ngày về',
            width: 180,
            valueFormatter: (value) => value ? new Date(value as string).toLocaleString('vi-VN') : '—',
        },

        {
            field: 'capacity',
            headerName: 'Sức chứa',
            width: 110,
            align: 'center',
            headerAlign: 'center',
        },

        {
            field: 'bookedSlots',
            headerName: 'Đã đặt',
            width: 110,
            align: 'center',
            headerAlign: 'center',
        },

        {
            field: 'availableSlots',
            headerName: 'Còn chỗ',
            width: 110,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Typography
                    fontSize="0.9rem"
                    fontWeight={700}
                    color={Number(params.value) > 0 ? '#047857' : '#dc2626'}
                >
                    {params.value ?? 0}
                </Typography>
            ),
        },

        {
            field: 'status',
            headerName: 'Trạng thái',
            width: 140,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => {
                const status = params.value as string;

                const statusMap: Record<string, { label: string; bg: string; color: string; border: string }> = {
                    draft: {
                        label: 'Bản nháp',
                        bg: '#f3f4f6',
                        color: '#6b7280',
                        border: '#e5e7eb',
                    },
                    open: {
                        label: 'Đang mở',
                        bg: '#ecfdf5',
                        color: '#047857',
                        border: '#a7f3d0',
                    },
                    full: {
                        label: 'Đã đầy',
                        bg: '#eff6ff',
                        color: '#1d4ed8',
                        border: '#bfdbfe',
                    },
                    closed: {
                        label: 'Đã đóng',
                        bg: '#fff7ed',
                        color: '#c2410c',
                        border: '#fed7aa',
                    },
                    cancelled: {
                        label: 'Đã hủy',
                        bg: '#fef2f2',
                        color: '#dc2626',
                        border: '#fecaca',
                    },
                };

                const config = statusMap[status] || {
                    label: status || 'Không rõ',
                    bg: '#f3f4f6',
                    color: '#6b7280',
                    border: '#e5e7eb',
                };

                return (
                    <Chip
                        size="small"
                        label={config.label}
                        sx={{
                            bgcolor: config.bg,
                            color: config.color,
                            fontWeight: 700,
                            border: `1px solid ${config.border}`,
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
                    <Tooltip title="Sửa lịch khởi hành">
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

                    <Tooltip title="Xóa lịch khởi hành">
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

                    <Tooltip title="Thao tác khác">
                        <IconButton
                            size="small"
                            onClick={(event) => handleOpenActionMenu(event, params.row)}
                            sx={{
                                color: DARK,
                                bgcolor: '#f3f4f6',
                                '&:hover': { bgcolor: '#e5e7eb' },
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
                            <EventNoteIcon />
                        </Box>

                        <Box>
                            <Typography
                                sx={{
                                    fontSize: { xs: '1.35rem', md: '1.75rem' },
                                    fontWeight: 800,
                                    color: DARK,
                                }}
                            >
                                Quản lý lịch khởi hành
                            </Typography>

                            <Typography fontSize="0.9rem" color={MUTED}>
                                Danh sách lịch khởi hành của tour #{currentTourId}
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
                            Thêm lịch khởi hành
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
                        minWidth: 210,
                        boxShadow: '0 12px 32px rgba(15,23,42,0.16)',
                        border: `1px solid ${BORDER}`,
                    },
                }}
            >
                <MenuItem
                    onClick={() => {
                        if (!selectedActionRow) return;
                        navigate(`/admin/departures/${selectedActionRow.id}/options`);
                        handleCloseActionMenu();
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1.25}>
                        <SettingsIcon fontSize="small" sx={{ color: '#2563eb' }} />
                        <span>Tùy chọn khởi hành</span>
                    </Stack>
                </MenuItem>

                <MenuItem
                    disabled={!selectedActionRow || selectedActionRow.status === 'open'}
                    onClick={async () => {
                        if (!selectedActionRow) return;
                        await handleOpenStatus(selectedActionRow.id);
                        handleCloseActionMenu();
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1.25}>
                        <PlayArrowIcon fontSize="small" sx={{ color: '#047857' }} />
                        <span>Mở lịch khởi hành</span>
                    </Stack>
                </MenuItem>

                <MenuItem
                    disabled={!selectedActionRow || selectedActionRow.status === 'closed'}
                    onClick={async () => {
                        if (!selectedActionRow) return;
                        await handleCloseStatus(selectedActionRow.id);
                        handleCloseActionMenu();
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1.25}>
                        <LockIcon fontSize="small" sx={{ color: '#c2410c' }} />
                        <span>Đóng lịch khởi hành</span>
                    </Stack>
                </MenuItem>

                <MenuItem
                    disabled={!selectedActionRow || selectedActionRow.status === 'cancelled'}
                    onClick={async () => {
                        if (!selectedActionRow) return;
                        await handleCancelStatus(selectedActionRow.id);
                        handleCloseActionMenu();
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1.25}>
                        <CancelIcon fontSize="small" sx={{ color: '#dc2626' }} />
                        <span>Hủy lịch khởi hành</span>
                    </Stack>
                </MenuItem>
            </Menu>

            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, color: DARK }}>
                    {editingItem ? 'Chỉnh sửa lịch khởi hành' : 'Thêm lịch khởi hành'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        <TextField
                            label="Code"
                            value={form.code}
                            onChange={(e) => setForm({ ...form, code: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            label="Ngày đi"
                            type="datetime-local"
                            value={form.departureDate}
                            onChange={(e) => setForm({ ...form, departureDate: e.target.value })}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Ngày về"
                            type="datetime-local"
                            value={form.returnDate}
                            onChange={(e) => setForm({ ...form, returnDate: e.target.value })}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Hạn đăng ký"
                            type="datetime-local"
                            value={form.registrationDeadline}
                            onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Sức chứa"
                            type="number"
                            value={form.capacity}
                            onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                            fullWidth
                        />
                        <TextField
                            label="Điều chỉnh giá"
                            type="number"
                            value={form.basePriceAdjustment}
                            onChange={(e) => setForm({ ...form, basePriceAdjustment: Number(e.target.value) })}
                            fullWidth
                        />
                        <TextField
                            label="Staff in charge ID"
                            type="number"
                            value={form.staffInChargeId || ''}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    staffInChargeId: e.target.value ? Number(e.target.value) : 0,
                                })
                            }
                            fullWidth
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