import { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import bookingService from '../../services/public/bookingService';
import { VnpayReturnResult } from '../../types/booking';

export default function VnpayReturnPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<VnpayReturnResult | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const verify = async () => {
            try {
                setLoading(true);
                setError('');

                const params = new URLSearchParams(location.search);
                const data = await bookingService.verifyVnpayReturn(params);

                setResult(data);
            } catch (err: any) {
                setError(
                    err?.response?.data?.message ||
                    'Không kiểm tra được kết quả thanh toán',
                );
            } finally {
                setLoading(false);
            }
        };

        verify();
    }, [location.search]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" py={10}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    if (!result) {
        return <Alert severity="warning">Không có dữ liệu thanh toán.</Alert>;
    }

    return (
        <Box maxWidth={720} mx="auto" py={6}>
            <Paper sx={{ p: 4, borderRadius: 4 }}>
                <Stack spacing={2}>
                    <Alert severity={result.success ? 'success' : 'error'}>
                        {result.success
                            ? 'Thanh toán thành công'
                            : 'Thanh toán chưa thành công'}
                    </Alert>

                    <Typography variant="h5" fontWeight={800}>
                        Kết quả thanh toán VNPay
                    </Typography>

                    <Typography>
                        Mã booking: {result.bookingCode || '-'}
                    </Typography>

                    <Typography>
                        Mã giao dịch hệ thống: {result.transactionRef || '-'}
                    </Typography>

                    <Typography>
                        Mã phản hồi: {result.responseCode}
                    </Typography>

                    <Typography>
                        Trạng thái giao dịch: {result.transactionStatus}
                    </Typography>

                    <Typography>
                        Mã giao dịch VNPay: {result.transactionNo || '-'}
                    </Typography>

                    <Typography>
                        Số tiền:{' '}
                        {result.amount
                            ? result.amount.toLocaleString('vi-VN') + ' đ'
                            : '-'}
                    </Typography>

                    <Typography>
                        Chữ ký:{' '}
                        {result.validSignature ? 'Hợp lệ' : 'Không hợp lệ'}
                    </Typography>

                    <Stack direction="row" spacing={2}>
                        {result.bookingId && (
                            <Button
                                variant="contained"
                                onClick={() =>
                                    navigate(`/my-bookings/${result.bookingId}`)
                                }
                            >
                                Xem booking
                            </Button>
                        )}

                        <Button
                            variant="outlined"
                            onClick={() => navigate('/my-bookings')}
                        >
                            Booking của tôi
                        </Button>
                    </Stack>
                </Stack>
            </Paper>
        </Box>
    );
}