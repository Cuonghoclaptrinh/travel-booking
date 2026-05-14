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

            <Stack className="register-page__form" spacing={2}>
                <TextField label="Họ và tên" fullWidth />
                <TextField label="Email" type="email" fullWidth />
                <TextField label="Số điện thoại" fullWidth />
                <TextField label="Mật khẩu" type="password" fullWidth />
                <TextField label="Xác nhận mật khẩu" type="password" fullWidth />

                <Button variant="contained" size="large" fullWidth>
                    Đăng ký
                </Button>
                <Button
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
                Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
            </Typography>
        </Paper>
    );
}