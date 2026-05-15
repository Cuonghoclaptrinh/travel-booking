import {
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    UserOutlined,
} from "@ant-design/icons";
import {
    Avatar,
    Button,
    Dropdown,
    Layout,
    Menu,
    Space,
    Typography,
    theme,
} from "antd";
import { useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { adminMenuItems } from "../../config/adminMenu";
import { useAuth } from "../../hooks/useAuth";
import { hasAnyPermission, hasAnyRole } from "../../utils/auth";

const { Header, Sider, Content } = Layout;

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { token } = theme.useToken();

    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    const visibleMenus = useMemo(() => {
        return adminMenuItems
            .filter((item) => {
                const roleOk = item.roles?.length
                    ? hasAnyRole(user, item.roles)
                    : true;

                const permissionOk = item.permissions?.length
                    ? hasAnyPermission(user, item.permissions)
                    : true;

                return roleOk || permissionOk;
            })
            .map((item) => ({
                key: item.key,
                icon: item.icon,
                label: item.label,
                path: item.path,
            }));
    }, [user]);

    const selectedKey = useMemo(() => {
        const matched = visibleMenus.find((item) => {
            if (item.path === "/admin") {
                return location.pathname === "/admin";
            }

            return location.pathname.startsWith(item.path);
        });

        return matched?.key ? [matched.key] : [];
    }, [location.pathname, visibleMenus]);

    const handleMenuClick = ({ key }: { key: string }) => {
        const target = visibleMenus.find((item) => item.key === key);
        if (target) {
            navigate(target.path);
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/auth/login", { replace: true });
    };

    const userMenuItems = [
        {
            key: "profile",
            label: "Hồ sơ",
            onClick: () => navigate("/profile"),
        },
        {
            key: "logout",
            label: "Đăng xuất",
            icon: <LogoutOutlined />,
            onClick: handleLogout,
        },
    ];

    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                width={240}
                style={{
                    position: "fixed",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    height: "100vh",
                    overflow: "auto",
                    zIndex: 1000,
                }}
            >
                <div
                    style={{
                        height: 64,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: collapsed ? "center" : "flex-start",
                        padding: collapsed ? 0 : "0 20px",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 18,
                    }}
                >
                    {collapsed ? "TT" : "Tour Travel Admin"}
                </div>

                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={selectedKey}
                    items={visibleMenus.map((item) => ({
                        key: item.key,
                        icon: item.icon,
                        label: item.label,
                    }))}
                    onClick={handleMenuClick}
                />
            </Sider>

            <Layout
                style={{
                    marginLeft: collapsed ? 80 : 240,
                    transition: "margin-left 0.2s",
                    minHeight: "100vh",
                }}
            >
                <Header
                    style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 999,
                        padding: "0 16px",
                        background: token.colorBgContainer,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    }}
                >
                    <Space>
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed((prev) => !prev)}
                        />

                        <Typography.Text strong>Trang quản trị</Typography.Text>
                    </Space>

                    <Dropdown menu={{ items: userMenuItems }} trigger={["click"]}>
                        <Space style={{ cursor: "pointer" }}>
                            <Avatar icon={<UserOutlined />} />
                            <div style={{ lineHeight: 1.2 }}>
                                <Typography.Text strong>{user?.name}</Typography.Text>
                                <br />
                                <Typography.Text type="secondary">
                                    {user?.email}
                                </Typography.Text>
                            </div>
                        </Space>
                    </Dropdown>
                </Header>

                <Content
                    style={{
                        margin: 16,
                        padding: 20,
                        background: token.colorBgContainer,
                        borderRadius: 12,
                        minHeight: 280,
                    }}
                >
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
}