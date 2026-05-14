import {
    AppBar,
    Avatar,
    Box,
    Button,
    Container,
    Stack,
    Toolbar,
    Typography,
} from "@mui/material";
import {
    Link as RouterLink,
    Outlet,
    useLocation,
    useNavigate,
} from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { canAccessAdmin } from "../../utils/auth";
import { useUserSocket } from "../../hooks/useUserSocket";
import CustomerAppBar from "../../components/common/customer/Navbar/CustomerAppBar";
import CustomerFooter from "../../components/common/customer/Footer/CustomerFooter";

const publicNavItems = [
    { label: "Trang chủ", path: "/home" },
    { label: "Điểm đến", path: "/destinations" },
    { label: "Khách sạn", path: "/hotels" },
    { label: "Tours", path: "/tours" },
];

export default function UserLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();

    const isAdmin = canAccessAdmin(user);

    useUserSocket(Number(user?.id));

    const handleLogout = () => {
        logout();
        navigate("/auth/login", { replace: true });
    };

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
            <CustomerAppBar />
            <Container maxWidth="lg" sx={{ py: 4, pt: 0 }}>
                <Outlet />
            </Container>
            <CustomerFooter />
        </Box>
    );
}
