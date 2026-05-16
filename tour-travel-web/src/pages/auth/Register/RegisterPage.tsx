import {
    Alert,
    Button,
    CircularProgress,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import './RegisterPage.scss';
import authService from '../../../services/authService';
import { useAuth } from '../../../hooks/useAuth';

export default function RegisterPage() {
    const { setAuth } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState('');

    const handleChange =
        (field: string) =>
            (event: React.ChangeEvent<HTMLInputElement>) => {
                setForm((prev) => ({
                    ...prev,
                    [field]: event.target.value,
                }));
            };

    const handleSubmit = async () => {
        try {
            setError('');

            if (
                !form.name ||
                !form.email ||
                !form.password ||
                !form.confirmPassword
            ) {
                setError('Vui lòng nhập đầy đủ thông tin');
                return;
            }

            if (form.password.length < 6) {
                setError('Mật khẩu tối thiểu 6 ký tự');
                return;
            }

            if (form.password !== form.confirmPassword) {
                setError('Mật khẩu xác nhận không khớp');
                return;
            }

            setLoading(true);

            const response = await authService.register({
                name: form.name,
                email: form.email,
                password: form.password,
            });

            setAuth(
                response.accessToken,
                response.user,
            );

            navigate('/home');
        } catch (error: any) {
            setError(
                error?.response?.data?.message ||
                'Đăng ký thất bại',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper className="register-page" elevation={8}>
            <Typography className="register-page__subtitle">
                Tour Travel
            </Typography>

            <Typography
                variant="h4"
                className="register-page__title"
            >
                Đăng ký
            </Typography>

            <Stack
                className="register-page__form"
                spacing={1.6}
            >
                {error && (
                    <Alert severity="error">
                        {error}
                    </Alert>
                )}

                <TextField
                    label="Họ và tên"
                    fullWidth
                    size="small"
                    value={form.name}
                    onChange={handleChange('name')}
                />

                <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    size="small"
                    value={form.email}
                    onChange={handleChange('email')}
                />

                <TextField
                    label="Mật khẩu"
                    type="password"
                    fullWidth
                    size="small"
                    value={form.password}
                    onChange={handleChange('password')}
                />

                <TextField
                    label="Xác nhận mật khẩu"
                    type="password"
                    fullWidth
                    size="small"
                    value={form.confirmPassword}
                    onChange={handleChange('confirmPassword')}
                />

                <Button
                    className="register-page__submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={loading}
                    onClick={handleSubmit}
                >
                    {loading ? (
                        <CircularProgress
                            size={22}
                            color="inherit"
                        />
                    ) : (
                        'Đăng ký'
                    )}
                </Button>

                <div className="register-page__divider">
                    <span>hoặc</span>
                </div>

                <Button
                    className="register-page__google"
                    variant="outlined"
                    size="large"
                    fullWidth
                    type="button"
                    onClick={() =>
                        authService.continueWithGoogle()
                    }
                >
                    Đăng ký bằng Google
                </Button>
            </Stack>

            <Typography className="register-page__footer">
                Đã có tài khoản?{' '}
                <Link to="/auth/login">
                    Đăng nhập
                </Link>
            </Typography>
        </Paper>
    );
}