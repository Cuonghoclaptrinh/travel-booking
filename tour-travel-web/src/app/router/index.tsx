
import { Navigate, createBrowserRouter } from "react-router-dom";

import AuthLayout from "../../layouts/AuthLayout/AuthLayout";
import AdminLayout from "../../layouts/AdminLayout/AdminLayout";
import UserLayout from "../../layouts/UserLayout/UserLayout";

import LoginPage from "../../pages/auth/Login/LoginPage";
import RegisterPage from "../../pages/auth/Register/RegisterPage";

import DashboardPage from "../../pages/admin/DashboardPage";
import UsersPage from "../../pages/admin/users/UsersPage";
import AdminDestinationsPage from "../../pages/admin/destinations/DestinationsPage";
import AdminAmenitiesPage from "../../pages/admin/amenities/AmenitiesPage";
import AdminHotelsPage from "../../pages/admin/hotels/HotelsPage";
import PermissionsPage from "../../pages/admin/permissions/PermissionsPage";
import RolesPage from "../../pages/admin/roles/RolesPage";
import AdminToursPage from "../../pages/admin/tours/ToursPage";


import HomePage from "../../pages/customer/HomePage";
import ProfilePage from "../../pages/customer/ProfilePage";
import CustomerDestinationsPage from "../../pages/customer/DestinationsPage";
import DestinationDetailPage from "../../pages/customer/DestinationDetailPage";
import CustomerHotelsPage from "../../pages/customer/HotelsPage";
import HotelDetailPage from "../../pages/customer/HotelDetailPage";
import CustomerToursPage from "../../pages/customer/ToursPage";
import TourDetailPage from "../../pages/customer/TourDetailPage";
import TourFormPage from "../../pages/admin/tours/TourFormPage";



import { useAuth } from "../../hooks/useAuth";
import { canAccessAdmin, hasAnyPermission } from "../../utils/auth";
import TourPackagesPage from "../../pages/admin/tours/TourPackagesPage";
import TourDeparturesPage from "../../pages/admin/tours/TourDeparturesPage";
import DepartureOptionsPage from "../../pages/admin/tours/DepartureOptionsPage";
import AdminBookingsPage from "../../pages/admin/bookings/AdminBookingsPage";
import MyBookingsPage from "../../pages/customer/MyBookingsPage";
import BookingDetailPage from "../../pages/customer/BookingDetailPage";
import VnpayReturnPage from "../../pages/customer/VnpayReturnPage";
import AdminPaymentsPage from "../../pages/admin/payments/AdminPaymentsPage";
import AdminPaymentDetailPage from "../../pages/admin/payments/AdminPaymentDetailPage";
import TourBookingOverviewPage from "../../pages/admin/bookings/TourBookingOverviewPage";
import TourBookingDetailPage from "../../pages/admin/bookings/TourBookingDetailPage";
import GoogleCallbackPage from "../../pages/auth/GoogleCallbackPage/GoogleCallbackPage";
import MockPayosPage from "../../pages/customer/MockPayosPage";

function RootRedirect() {
    const { loading, isAuthenticated, user } = useAuth();

    if (loading) return <div>Đang tải...</div>;

    if (!isAuthenticated) {
        return <Navigate to="/home" replace />;
    }

    return <Navigate to={canAccessAdmin(user) ? "/admin" : "/home"} replace />;
}

function GuestOnlyPage({ children }: { children: React.ReactNode }) {
    const { loading, isAuthenticated, user } = useAuth();

    if (loading) return <div>Đang tải...</div>;

    if (isAuthenticated) {
        return <Navigate to={canAccessAdmin(user) ? "/admin" : "/home"} replace />;
    }

    return <>{children}</>;
}

function RequireAuthPage({ children }: { children: React.ReactNode }) {
    const { loading, isAuthenticated } = useAuth();

    if (loading) return <div>Đang kiểm tra đăng nhập...</div>;
    if (!isAuthenticated) return <Navigate to="/auth/login" replace />;

    return <>{children}</>;
}

function RequireAdminPage({ children }: { children: React.ReactNode }) {
    const { loading, isAuthenticated, user } = useAuth();

    if (loading) return <div>Đang kiểm tra quyền...</div>;
    if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
    if (!canAccessAdmin(user)) return <Navigate to="/home" replace />;

    return <>{children}</>;
}

function RequirePermissionPage({
    permissions,
    children,
}: {
    permissions: string[];
    children: React.ReactNode;
}) {
    const { loading, isAuthenticated, user } = useAuth();

    if (loading) return <div>Đang kiểm tra quyền...</div>;
    if (!isAuthenticated) return <Navigate to="/auth/login" replace />;

    const allowed = hasAnyPermission(user, permissions);

    if (!allowed) {
        return <Navigate to="/admin" replace />;
    }

    return <>{children}</>;
}

const router = createBrowserRouter([
    {
        path: "/",
        element: <RootRedirect />,
    },
    {
        path: "/payment/vnpay-return",
        element: <VnpayReturnPage />,
    },
    {
        path: "/payment/mock-payos",
        element: <MockPayosPage />,
    },

    // auth
    {
        path: "/auth",
        element: (
            <GuestOnlyPage>
                <AuthLayout />
            </GuestOnlyPage>
        ),
        children: [
            {
                path: "login",
                element: <LoginPage />,
            },
            {
                path: "register",
                element: <RegisterPage />,
            },
            {
                path: "google/callback",
                element: <GoogleCallbackPage />,
            },

        ],
    },

    // public + user layout
    {
        element: <UserLayout />,
        children: [
            {
                path: "/home",
                element: <HomePage />,
            },
            {
                path: "/destinations",
                element: <CustomerDestinationsPage />,
            },
            {
                path: "/destinations/:id",
                element: <DestinationDetailPage />,
            },
            {
                path: "/hotels",
                element: <CustomerHotelsPage />,
            },
            {
                path: "/hotels/:id",
                element: <HotelDetailPage />,
            },
            {
                path: "/profile",
                element: (
                    <RequireAuthPage>
                        <ProfilePage />
                    </RequireAuthPage>
                ),
            },
            {
                path: 'profile/bookings',
                element:
                    <RequireAuthPage>
                        <MyBookingsPage />
                    </RequireAuthPage>
            },
            {
                path: 'profile/bookings/:id',
                element:
                    <RequireAuthPage>
                        <BookingDetailPage />
                    </RequireAuthPage>
            },
            {
                path: "/my-bookings",
                element: (
                    <RequireAuthPage>
                        <MyBookingsPage />
                    </RequireAuthPage>
                ),
            },
            {
                path: "/my-bookings/:id",
                element: (
                    <RequireAuthPage>
                        <BookingDetailPage />
                    </RequireAuthPage>
                ),
            },
            {
                path: "/tours",
                element: <CustomerToursPage />,
            },
            {
                path: "/tours/:slug",
                element: <TourDetailPage />,
            },

        ],
    },

    // admin
    {
        path: "/admin",
        element: (
            <RequireAdminPage>
                <AdminLayout />
            </RequireAdminPage>
        ),
        children: [
            {
                index: true,
                element: <DashboardPage />,
            },
            {
                path: "users",
                element: (
                    <RequirePermissionPage permissions={["user.view"]}>
                        <UsersPage />
                    </RequirePermissionPage>
                ),
            },
            {
                path: "destinations",
                element: (
                    <RequirePermissionPage permissions={["destination.view"]}>
                        <AdminDestinationsPage />
                    </RequirePermissionPage>
                ),
            },
            {
                path: "amenities",
                element: (
                    <RequirePermissionPage permissions={["amenity.view"]}>
                        <AdminAmenitiesPage />
                    </RequirePermissionPage>
                ),
            },
            {
                path: "hotels",
                element: (
                    <RequirePermissionPage permissions={["hotel.view"]}>
                        <AdminHotelsPage />
                    </RequirePermissionPage>
                ),
            },
            {
                path: "permissions",
                element: (
                    <RequirePermissionPage permissions={["permission.view"]}>
                        <PermissionsPage />
                    </RequirePermissionPage>
                ),
            },
            {
                path: "roles",
                element: (
                    <RequirePermissionPage permissions={["role.view"]}>
                        <RolesPage />
                    </RequirePermissionPage>
                ),
            },
            {
                path: "tours",
                element: (
                    <RequirePermissionPage permissions={["tour.view"]}>
                        <AdminToursPage />
                    </RequirePermissionPage>
                ),
            },
            {
                path: "tours/create",
                element: (
                    <RequirePermissionPage permissions={["tour.create"]}>
                        <TourFormPage />
                    </RequirePermissionPage>
                ),
            },
            {
                path: "tours/:id/edit",
                element: (
                    <RequirePermissionPage permissions={["tour.update"]}>
                        <TourFormPage />
                    </RequirePermissionPage>
                ),
            },
            {
                path: "tours/:tourId/packages",
                element: (
                    <RequirePermissionPage permissions={["tour.view"]}>
                        <TourPackagesPage />
                    </RequirePermissionPage>
                ),
            },
            {
                path: "tours/:tourId/departures",
                element: (
                    <RequirePermissionPage permissions={["tour.view"]}>
                        <TourDeparturesPage />
                    </RequirePermissionPage>
                ),
            },
            {
                path: "departures/:departureId/options",
                element: (
                    <RequirePermissionPage permissions={["tour.view"]}>
                        <DepartureOptionsPage />
                    </RequirePermissionPage>
                ),
            },
            {
                path: 'bookings',
                element:
                    <RequirePermissionPage permissions={["booking.admin.view"]}>
                        <AdminBookingsPage />
                    </RequirePermissionPage>
            },
            {
                path: "payments",
                element: <AdminPaymentsPage />,
            },
            {
                path: "payments/:id",
                element: <AdminPaymentDetailPage />,
            },
            {
                path: "bookings/tour-overview",
                element: (
                    <RequirePermissionPage permissions={["booking.admin.view"]}>
                        <TourBookingOverviewPage />
                    </RequirePermissionPage>
                ),
            },
            {
                path: "bookings/tours/:tourId",
                element: (
                    <RequirePermissionPage permissions={["booking.admin.view"]}>
                        <TourBookingDetailPage />
                    </RequirePermissionPage>
                ),
            },


        ],
    },

    {
        path: "*",
        element: <Navigate to="/home" replace />,
    },
]);

export default router;
