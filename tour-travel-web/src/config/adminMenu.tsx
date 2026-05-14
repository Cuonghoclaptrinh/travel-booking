import {
    AppstoreOutlined,
    EnvironmentOutlined,
    HomeOutlined,
    TeamOutlined,
    SafetyCertificateOutlined,
    ApartmentOutlined,
    CarOutlined,
    BookOutlined,
    CreditCardOutlined
} from "@ant-design/icons";
import { ReactNode } from "react";

export interface AdminMenuItem {
    key: string;
    label: string;
    path: string;
    icon: ReactNode;
    roles?: string[];
    permissions?: string[];
}

export const adminMenuItems: AdminMenuItem[] = [
    {
        key: "dashboard",
        label: "Dashboard",
        path: "/admin",
        icon: <HomeOutlined />,
        roles: ["admin", "super_admin", "staff"],
        permissions: ["dashboard.read"],
    },
    {
        key: "users",
        label: "Người dùng",
        path: "/admin/users",
        icon: <TeamOutlined />,
        roles: ["admin", "super_admin", "staff"],
        permissions: ["user.view"],
    },
    {
        key: "destinations",
        label: "Điểm đến",
        path: "/admin/destinations",
        icon: <EnvironmentOutlined />,
        roles: ["admin", "super_admin", "staff"],
        permissions: ["destination.view"],
    },
    {
        key: "amenities",
        label: "Tiện ích",
        path: "/admin/amenities",
        icon: <AppstoreOutlined />,
        roles: ["admin", "super_admin", "staff"],
        permissions: ["amenity.view"],
    },
    {
        key: "hotels",
        label: "Khách sạn",
        path: "/admin/hotels",
        icon: <HomeOutlined />,
        roles: ["admin", "super_admin", "staff"],
        permissions: ["hotel.view"],
    },
    {
        key: "permissions",
        label: "Permissions",
        path: "/admin/permissions",
        icon: <SafetyCertificateOutlined />,
        roles: ["admin", "super_admin", "staff"],
        permissions: ["permission.view"],
    },
    {
        key: "roles",
        label: "Roles",
        path: "/admin/roles",
        icon: <ApartmentOutlined />,
        roles: ["admin", "super_admin", "staff"],
        permissions: ["role.view"],
    },
    {
        key: "tours",
        label: "Tours",
        path: "/admin/tours",
        icon: <CarOutlined />,
        roles: ["admin", "super_admin", "staff"],
        permissions: ["tour.view"],
    },
    {
        key: "bookings",
        label: "Bookings",
        path: "/admin/bookings",
        icon: <BookOutlined />,
        roles: ["admin", "super_admin", "staff"],
        permissions: ["booking.admin.view"],
    },
    {
        key: "booking-tour-overview",
        label: "Booking theo tour",
        path: "/admin/bookings/tour-overview",
        icon: <BookOutlined />,
        roles: ["admin", "super_admin", "staff"],
        permissions: ["booking.admin.view"],
    },
    {
        key: "payments",
        label: "Thanh toán",
        path: "/admin/payments",
        icon: <CreditCardOutlined />,
        roles: ["admin", "super_admin", "staff"],
        permissions: ["payment.admin.view"],
    },

];