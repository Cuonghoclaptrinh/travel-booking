import { Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import './RegisterPage.scss';
import authService from '../../../services/authService';

export default function RegisterPage() {
    return (
        <Paper className="register-page" elevation={8}>
            <Typography className="register-page__subtitle">Tour Travel</Typography>

            <Typography variant="h4" className="register-page__title">
                Đăng ký
            </Typography>

            <Stack className="register-page__form" spacing={1.6}>
                <TextField label="Họ và tên" fullWidth size="small" />
                <TextField label="Email" type="email" fullWidth size="small" />
                <TextField label="Số điện thoại" fullWidth size="small" />
                <TextField label="Mật khẩu" type="password" fullWidth size="small" />
                <TextField label="Xác nhận mật khẩu" type="password" fullWidth size="small" />

                <Button
                    className="register-page__submit"
                    variant="contained"
                    size="large"
                    fullWidth
                >
                    Đăng ký
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
                    onClick={() => authService.continueWithGoogle()}
                >
                    Đăng ký bằng Google
                </Button>
            </Stack>

            <Typography className="register-page__footer">
                Đã có tài khoản? <Link to="/auth/login">Đăng nhập</Link>
            </Typography>
        </Paper>
    );
}