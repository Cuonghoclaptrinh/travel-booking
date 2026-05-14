import { useState } from "react";
import {
    AppBar,
    Avatar,
    Box,
    Button,
    Container,
    Divider,
    IconButton,
    Menu,
    MenuItem,
    Stack,
    Toolbar,
    Typography,
} from "@mui/material";
import {
    AccountCircleOutlined,
    LogoutOutlined,
    ReceiptLongOutlined,
} from "@mui/icons-material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../hooks/useAuth";


export default function CustomerAppBar() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openUserMenu = Boolean(anchorEl);

    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseUserMenu = () => {
        setAnchorEl(null);
    };

    const handleGoProfile = () => {
        handleCloseUserMenu();
        navigate("/profile");
    };

    const handleGoMyBookings = () => {
        handleCloseUserMenu();
        navigate("/my-bookings");
    };

    const location = useLocation();

    const navItems = [
        { label: "Trang chủ", path: "/home" },
        { label: "Tour", path: "/tours" },
        { label: "Điểm đến", path: "/destinations" },
    ];

    const handleLogout = async () => {
        handleCloseUserMenu();

        try {
            await logout();
        } finally {
            navigate("/");
        }
    };

    return (
        <AppBar
            position="sticky"
            elevation={0}
            sx={{
                bgcolor: "#ffffff",
                color: "#0f172a",
                borderBottom: "1px solid #e5e7eb",
            }}
        >
            <Container maxWidth="lg">

                <Toolbar disableGutters sx={{ minHeight: 72 }}>
                    <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>
                        <Typography
                            component={Link}
                            to="/home"
                            variant="h6"
                            sx={{
                                textDecoration: "none",
                                color: "primary.main",
                                fontWeight: 900,
                            }}
                        >
                            Travel Booking
                        </Typography>
                    </Box>

                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                            flex: 1,
                            display: { xs: "none", md: "flex" },
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        {navItems.map((item) => {
                            const isActive =
                                item.path === "/home"
                                    ? location.pathname === "/home" || location.pathname === "/"
                                    : location.pathname.startsWith(item.path);

                            return (
                                <Button
                                    key={item.path}
                                    component={Link}
                                    to={item.path}
                                    color="inherit"
                                    sx={{
                                        px: 1.8,
                                        textTransform: "none",
                                        fontSize: 15,
                                        fontWeight: isActive ? 900 : 600,
                                        color: isActive ? "primary.main" : "text.primary",
                                        "&:hover": {
                                            color: "primary.main",
                                            bgcolor: "transparent",
                                        },
                                    }}
                                >
                                    {item.label}
                                </Button>
                            );
                        })}
                    </Stack>

                    <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
                        {!user ? (
                            <Stack direction="row" spacing={1}>
                                <Button component={Link} to="/auth/login" variant="outlined">
                                    Đăng nhập
                                </Button>

                                <Button component={Link} to="/auth/register" variant="contained">
                                    Đăng ký
                                </Button>
                            </Stack>
                        ) : (
                            <>
                                <IconButton
                                    onClick={handleOpenUserMenu}
                                    sx={{
                                        p: 0.5,
                                        borderRadius: 999,
                                        "&:hover": {
                                            bgcolor: "rgba(25,118,210,0.08)",
                                        },
                                    }}
                                >
                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        alignItems="center"
                                        sx={{
                                            px: 1,
                                            py: 0.5,
                                        }}
                                    >
                                        <Avatar src={user?.avatarUrl || undefined}>
                                            {!user?.avatarUrl &&
                                                (user?.name?.charAt(0)?.toUpperCase() || "U")}
                                        </Avatar>

                                        <Typography
                                            variant="body2"
                                            fontWeight={700}
                                            sx={{
                                                display: { xs: "none", md: "block" },
                                                color: "text.primary",
                                            }}
                                        >
                                            {user?.name}
                                        </Typography>
                                    </Stack>
                                </IconButton>

                                <Menu
                                    anchorEl={anchorEl}
                                    open={openUserMenu}
                                    onClose={handleCloseUserMenu}
                                    anchorOrigin={{
                                        vertical: "bottom",
                                        horizontal: "right",
                                    }}
                                    transformOrigin={{
                                        vertical: "top",
                                        horizontal: "right",
                                    }}
                                    PaperProps={{
                                        sx: {
                                            mt: 1,
                                            minWidth: 220,
                                            borderRadius: 3,
                                            boxShadow: "0 16px 40px rgba(15,23,42,0.16)",
                                            overflow: "hidden",
                                        },
                                    }}
                                >
                                    <Box sx={{ px: 2, py: 1.5 }}>
                                        <Typography fontWeight={800} noWrap>
                                            {user.name}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            noWrap
                                        >
                                            {user.email}
                                        </Typography>
                                    </Box>

                                    <Divider />

                                    <MenuItem onClick={handleGoProfile}>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <AccountCircleOutlined fontSize="small" />
                                            <Typography>Hồ sơ của tôi</Typography>
                                        </Stack>
                                    </MenuItem>

                                    <MenuItem onClick={handleGoMyBookings}>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <ReceiptLongOutlined fontSize="small" />
                                            <Typography>Đơn của tôi</Typography>
                                        </Stack>
                                    </MenuItem>

                                    <Divider />

                                    <MenuItem
                                        onClick={handleLogout}
                                        sx={{
                                            color: "error.main",
                                        }}
                                    >
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <LogoutOutlined fontSize="small" />
                                            <Typography>Đăng xuất</Typography>
                                        </Stack>
                                    </MenuItem>
                                </Menu>
                            </>
                        )}
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
}