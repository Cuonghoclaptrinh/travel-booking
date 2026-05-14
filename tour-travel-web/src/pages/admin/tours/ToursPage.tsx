import { useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, IconButton, Menu, MenuItem, Paper, Stack, Switch, TextField, Tooltip, Typography } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import tourService from '../../../services/admin/tourService';
import { featureOptions, Tour, tourTypeOptions } from '../../../types/tour';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PublishIcon from '@mui/icons-material/Publish';
import LockIcon from '@mui/icons-material/Lock';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';

const GOLD = '#c9a84c';
const GOLD_DARK = '#a8842f';
const DARK = '#1f2937';
const MUTED = '#6b7280';
const BORDER = 'rgba(0,0,0,0.08)';
const SURFACE = '#ffffff';
const SOFT_BG = '#f8fafc';

export default function ToursPage() {
    const navigate = useNavigate();

    const [items, setItems] = useState<Tour[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [actionId, setActionId] = useState<number | null>(null);
    const [updatingTourId, setUpdatingTourId] = useState<string | number | null>(null);

    const [actionMenuAnchor, setActionMenuAnchor] = useState<HTMLElement | null>(null);
    const [selectedActionRow, setSelectedActionRow] = useState<Tour | null>(null);

    const openActionMenu = Boolean(actionMenuAnchor);

    const handleOpenActionMenu = (
        event: React.MouseEvent<HTMLElement>,
        row: Tour,
    ) => {
        setActionMenuAnchor(event.currentTarget);
        setSelectedActionRow(row);
    };

    const handleCloseActionMenu = () => {
        setActionMenuAnchor(null);
        setSelectedActionRow(null);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await tourService.getPaging({
                page: 1,
                limit: 20,
                search: search || '',
            });
            setItems(res.items || []);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Không tải được danh sách tour');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handlePublish = async (id: number) => {
        try {
            setActionId(id);
            setError('');
            setSuccess('');
            await tourService.publish(id);
            setSuccess('Publish tour thành công');
            await fetchData();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Publish tour thất bại');
        } finally {
            setActionId(null);
        }
    };

    const handleClose = async (id: number) => {
        try {
            setActionId(id);
            setError('');
            setSuccess('');
            await tourService.close(id);
            setSuccess('Đóng tour thành công');
            await fetchData();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Đóng tour thất bại');
        } finally {
            setActionId(null);
        }
    };

    const handleDelete = async (id: number) => {
        const ok = window.confirm('Bạn có chắc muốn xóa tour này không?');
        if (!ok) return;

        try {
            setActionId(id);
            setError('');
            setSuccess('');
            await tourService.remove(id);
            setSuccess('Xóa tour thành công');
            await fetchData();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Xóa tour thất bại');
        } finally {
            setActionId(null);
        }
    };

    const handleToggleTourFlag = async (
        tourId: number | string,
        field: 'isFeatured' | 'isHotDeal',
        checked: boolean,
    ) => {
        const numericTourId = Number(tourId);

        try {
            setUpdatingTourId(numericTourId);

            console.log('Toggle tour flag:', {
                tourId: numericTourId,
                field,
                checked,
            });

            const updatedTour = await tourService.update(numericTourId, {
                [field]: checked,
            });

            console.log('Updated tour response:', updatedTour);

            setItems((prev) =>
                prev.map((item) =>
                    Number(item.id) === numericTourId
                        ? {
                            ...item,
                            [field]: checked,
                        }
                        : item,
                ),
            );

            await fetchData();
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                'Cập nhật thất bại';

            alert(Array.isArray(message) ? message.join(', ') : message);
        } finally {
            setUpdatingTourId(null);
        }
    };

    const columns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 50 },
        { field: 'name', headerName: 'Tên tour', minWidth: 220, flex: 1 },
        { field: 'slug', headerName: 'Slug', minWidth: 180, flex: 0.8 },
        { field: 'destinationId', headerName: 'Điểm đến', width: 100 },
        {
            field: 'duration',
            headerName: 'Thời lượng',
            width: 120,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Chip
                    size="small"
                    label={`${params.row.durationDays} ngày ${params.row.durationNights} đêm`}
                    sx={{
                        bgcolor: '#fff7ed',
                        color: '#c2410c',
                        fontWeight: 700,
                        border: '1px solid #fed7aa',
                    }}
                />
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
                    published: {
                        label: 'Đang công khai',
                        bg: '#ecfdf5',
                        color: '#047857',
                        border: '#a7f3d0',
                    },
                    closed: {
                        label: 'Đã đóng',
                        bg: '#fff7ed',
                        color: '#c2410c',
                        border: '#fed7aa',
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
            field: 'isFeatured',
            headerName: 'Nổi bật',
            width: 80,
            sortable: false,
            renderCell: (params) => {
                const tourId = params.row.id;
                const checked = Boolean(params.row.isFeatured);

                return (
                    <Switch
                        checked={checked}
                        disabled={updatingTourId === tourId}
                        onChange={(event) =>
                            handleToggleTourFlag(
                                tourId,
                                'isFeatured',
                                event.target.checked,
                            )
                        }
                        sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                                color: GOLD,
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                bgcolor: GOLD,
                            },
                        }}
                    />
                );
            },
        },
        {
            field: 'isHotDeal',
            headerName: 'Giá tốt',
            width: 80,
            sortable: false,
            renderCell: (params) => {
                const tourId = params.row.id;
                const checked = Boolean(params.row.isHotDeal);

                return (
                    <Switch
                        checked={checked}
                        disabled={updatingTourId === tourId}
                        onChange={(event) =>
                            handleToggleTourFlag(
                                tourId,
                                'isHotDeal',
                                event.target.checked,
                            )
                        }
                        sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                                color: GOLD,
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                bgcolor: GOLD,
                            },
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
                    <Tooltip title="Sửa tour">
                        <IconButton
                            size="small"
                            color="primary"
                            onClick={() => navigate(`/admin/tours/${params.row.id}/edit`)}
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Xóa tour">
                        <span>
                            <IconButton
                                size="small"
                                color="error"
                                disabled={actionId === params.row.id}
                                onClick={() => handleDelete(params.row.id)}
                            >
                                <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>

                    <Tooltip title="Thao tác khác">
                        <IconButton
                            size="small"
                            onClick={(event) => handleOpenActionMenu(event, params.row)}
                        >
                            <MoreVertIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            ),
        },
        // {
        //     field: 'tourType',
        //     headerName: 'Loại tour',
        //     width: 150,
        //     renderCell: (params) => {
        //         const found = tourTypeOptions.find((x) => x.value === params.value);
        //         return <span>{found?.label || params.value || '-'}</span>;
        //     },
        // },
        // {
        //     field: 'featureTags',
        //     headerName: 'Đặc điểm',
        //     minWidth: 220,
        //     flex: 0.8,
        //     sortable: false,
        //     renderCell: (params) => (
        //         <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
        //             {(params.value || []).map((tag: string) => {
        //                 const found = featureOptions.find((x) => x.value === tag);

        //                 return (
        //                     <Chip
        //                         key={tag}
        //                         size="small"
        //                         label={found?.label || tag}
        //                     />
        //                 );
        //             })}
        //         </Stack>
        //     ),
        // },
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
                            <TravelExploreIcon />
                        </Box>

                        <Box>
                            <Typography
                                sx={{
                                    fontSize: { xs: '1.35rem', md: '1.75rem' },
                                    fontWeight: 800,
                                    color: DARK,
                                }}
                            >
                                Quản lý tour
                            </Typography>

                            <Typography fontSize="0.9rem" color={MUTED}>
                                Quản lý danh sách tour, trạng thái hiển thị và các cấu hình liên quan
                            </Typography>
                        </Box>
                    </Stack>

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/admin/tours/create')}
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
                        Tạo tour
                    </Button>
                </Stack>
            </Paper>

            {error && (
                <Alert severity="error" onClose={() => setError('')}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}

            <Paper
                sx={{
                    p: 2,
                    borderRadius: 4,
                    border: `1px solid ${BORDER}`,
                    boxShadow: '0 4px 20px rgba(15,23,42,0.04)',
                    bgcolor: SURFACE,
                }}
            >
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                    <TextField
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm theo tên tour / slug"
                        fullWidth
                        size="small"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2.5,
                                bgcolor: '#fff',
                                '& fieldset': {
                                    borderColor: BORDER,
                                },
                                '&:hover fieldset': {
                                    borderColor: GOLD,
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: GOLD,
                                },
                            },
                        }}
                    />

                    <Button
                        variant="contained"
                        startIcon={<SearchIcon />}
                        onClick={fetchData}
                        sx={{
                            minWidth: 130,
                            borderRadius: 2.5,
                            bgcolor: GOLD,
                            textTransform: 'none',
                            fontWeight: 700,
                            boxShadow: 'none',
                            '&:hover': {
                                bgcolor: GOLD_DARK,
                                boxShadow: 'none',
                            },
                        }}
                    >
                        Tìm kiếm
                    </Button>
                </Stack>
            </Paper>

            <Paper
                sx={{
                    height: 640,
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
                        getRowHeight={() => 'auto'}
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
            >
                <MenuItem
                    onClick={() => {
                        if (!selectedActionRow) return;
                        navigate(`/admin/tours/${selectedActionRow.id}/packages`);
                        handleCloseActionMenu();
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1.25}>
                        <Inventory2Icon fontSize="small" sx={{ color: '#2563eb' }} />
                        <span>Gói tour</span>
                    </Stack>
                </MenuItem>

                <MenuItem
                    onClick={() => {
                        if (!selectedActionRow) return;
                        navigate(`/admin/tours/${selectedActionRow.id}/departures`);
                        handleCloseActionMenu();
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1.25}>
                        <EventNoteIcon fontSize="small" sx={{ color: GOLD }} />
                        <span>Lịch khởi hành</span>
                    </Stack>
                </MenuItem>

                <MenuItem
                    disabled={
                        !selectedActionRow ||
                        actionId === Number(selectedActionRow.id) ||
                        selectedActionRow.status === 'published'
                    }
                    onClick={async () => {
                        if (!selectedActionRow) return;
                        await handlePublish(Number(selectedActionRow.id));
                        handleCloseActionMenu();
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1.25}>
                        <PublishIcon fontSize="small" sx={{ color: '#047857' }} />
                        <span>Công khai tour</span>
                    </Stack>
                </MenuItem>

                <MenuItem
                    disabled={
                        !selectedActionRow ||
                        actionId === Number(selectedActionRow.id) ||
                        selectedActionRow.status === 'closed'
                    }
                    onClick={async () => {
                        if (!selectedActionRow) return;
                        await handleClose(Number(selectedActionRow.id));
                        handleCloseActionMenu();
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1.25}>
                        <LockIcon fontSize="small" sx={{ color: '#c2410c' }} />
                        <span>Đóng tour</span>
                    </Stack>
                </MenuItem>
            </Menu>
        </Stack>
    );
}
