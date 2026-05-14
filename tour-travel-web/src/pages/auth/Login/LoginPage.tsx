import { useState, ChangeEvent, FormEvent } from "react";
import { Alert, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { hasAnyPermission, hasAnyRole } from "../../../utils/auth";
import "./LoginPage.scss";
import authService from "../../../services/authService";

const ADMIN_ROLES = ["admin", "super_admin", "staff"];
const ADMIN_PERMISSIONS = ["admin.access", "dashboard.read"];

interface LoginFormState {
    email: string;
    password: string;
}

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [form, setForm] = useState<LoginFormState>({
        email: "",
        password: "",
    });

    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            const currentUser = await login(form);

            const canAccessAdmin =
                hasAnyRole(currentUser, ADMIN_ROLES) ||
                hasAnyPermission(currentUser, ADMIN_PERMISSIONS);

            navigate(canAccessAdmin ? "/admin" : "/home", { replace: true });
        } catch (err: any) {
            const message =
                err?.response?.data?.message || err?.message || "Đăng nhập thất bại";

            setError(Array.isArray(message) ? message.join(", ") : message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Paper className="login-page" elevation={8}>
            <Typography className="login-page__subtitle">Tour Travel</Typography>
            <Typography variant="h4" className="login-page__title">
                Đăng nhập
            </Typography>

            <Stack
                component="form"
                className="login-page__form"
                spacing={2}
                onSubmit={handleSubmit}
            >
                <TextField
                    label="Email"
                    name="email"
                    type="email"
                    fullWidth
                    value={form.email}
                    onChange={handleChange}
                />

                <TextField
                    label="Mật khẩu"
                    name="password"
                    type="password"
                    fullWidth
                    value={form.password}
                    onChange={handleChange}
                />

                {error && <Alert severity="error">{error}</Alert>}

                <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    type="submit"
                    disabled={submitting}
                >
                    {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>
                <Button
                    variant="outlined"
                    size="large"
                    fullWidth
                    type="button"
                    onClick={() => authService.continueWithGoogle()}
                >
                    Tiếp tục với Google
                </Button>
            </Stack>

            <Typography className="login-page__footer">
                Chưa có tài khoản? <Link to="/auth/register">Đăng ký ngay</Link>
            </Typography>


        </Paper>
    );
}