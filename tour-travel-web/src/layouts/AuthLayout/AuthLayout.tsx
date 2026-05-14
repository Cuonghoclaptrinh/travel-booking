import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import './AuthLayout.scss';

export default function AuthLayout() {
    return (
        <Box className="auth-layout">
            <Box className="auth-layout__overlay" />
            <Box className="auth-layout__content">
                <Outlet />
            </Box>
        </Box>
    );
}