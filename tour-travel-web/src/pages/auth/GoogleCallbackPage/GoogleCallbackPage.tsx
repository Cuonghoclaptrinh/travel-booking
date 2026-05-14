import { useEffect, useState } from "react";
import { Alert, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { hasAnyPermission, hasAnyRole } from "../../../utils/auth";
import { useAuth } from "../../../hooks/useAuth";

const ADMIN_ROLES = ["admin", "super_admin", "staff"];
const ADMIN_PERMISSIONS = ["admin.access", "dashboard.read"];

export default function GoogleCallbackPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { fetchMe } = useAuth();
    const [error, setError] = useState("");

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const token = searchParams.get("token");

                if (!token) {
                    setError("Không tìm thấy token đăng nhập Google.");
                    return;
                }

                localStorage.setItem("accessToken", token);

                const currentUser = await fetchMe();

                const canAccessAdmin =
                    hasAnyRole(currentUser, ADMIN_ROLES) ||
                    hasAnyPermission(currentUser, ADMIN_PERMISSIONS);

                navigate(canAccessAdmin ? "/admin" : "/home", { replace: true });
            } catch (err: any) {
                const message =
                    err?.response?.data?.message ||
                    err?.message ||
                    "Đăng nhập Google thất bại";

                setError(Array.isArray(message) ? message.join(", ") : message);
            }
        };

        handleCallback();
    }, [searchParams, fetchMe, navigate]);

    return (
        <Paper elevation={8} sx={{ p: 4, maxWidth: 420, mx: "auto", mt: 8 }}>
            <Stack spacing={2} alignItems="center">
                {!error && <CircularProgress />}

                <Typography variant="h6">
                    Đang xử lý đăng nhập Google...
                </Typography>

                {error && <Alert severity="error">{error}</Alert>}
            </Stack>
        </Paper>
    );
}