import { useEffect, useMemo, useState } from "react";
import {
    Button,
    Input,
    Space,
    Table,
    Tag,
    Typography,
    message,
} from "antd";
import type { ColumnsType } from "antd/es/table";

import PageHeader from "../../../components/common/PageHeader";
import DeleteConfirmButton from "../../../components/common/DeleteConfirmButton";
import { useTableQuery } from "../../../hooks/useTableQuery";
import { useAuth } from "../../../hooks/useAuth";
import { hasPermission } from "../../../utils/auth";
import usersService from "../../../services/admin/usersService";
import { CreateUserPayload, IUser } from "../../../types/user";
import UserFormModal from "./components/UserFormModal";
import AssignRolesModal from "./components/AssignRolesModal";

export default function UsersPage() {
    const { user } = useAuth();
    const [messageApi, contextHolder] = message.useMessage();

    const {
        page,
        limit,
        keyword,
        query,
        reloadKey,
        onSearch,
        onChangePage,
        reload,
    } = useTableQuery({
        defaultPage: 1,
        defaultLimit: 10,
    });

    const [data, setData] = useState<IUser[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);

    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [editingRecord, setEditingRecord] = useState<IUser | null>(null);

    const [assignModalOpen, setAssignModalOpen] = useState<boolean>(false);
    const [assigningUser, setAssigningUser] = useState<IUser | null>(null);

    const canView = hasPermission(user, "user.view");
    const canCreate = hasPermission(user, "user.create");
    const canUpdate = hasPermission(user, "user.update");
    const canDelete = hasPermission(user, "user.delete");
    const canViewRoles = hasPermission(user, "role.view");

    const fetchData = async () => {
        if (!canView) return;

        setLoading(true);
        try {
            const response = await usersService.getPaging(query);
            setData(response.data);
            setTotal(response.total);
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message || "Không thể tải danh sách user";
            messageApi.error(
                Array.isArray(errorMessage)
                    ? errorMessage.join(", ")
                    : errorMessage
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page, limit, keyword, reloadKey]);

    const openCreateModal = () => {
        setModalMode("create");
        setEditingRecord(null);
        setModalOpen(true);
    };

    const openEditModal = (record: IUser) => {
        setModalMode("edit");
        setEditingRecord(record);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingRecord(null);
    };

    const openAssignRolesModal = (record: IUser) => {
        setAssigningUser(record);
        setAssignModalOpen(true);
    };

    const closeAssignRolesModal = () => {
        setAssignModalOpen(false);
        setAssigningUser(null);
    };

    const handleSubmit = async (values: CreateUserPayload) => {
        setSubmitting(true);
        try {
            if (modalMode === "create") {
                await usersService.create(values);
                messageApi.success("Tạo user thành công");
            } else if (editingRecord) {
                await usersService.update(editingRecord.id, values);
                messageApi.success("Cập nhật user thành công");
            }

            closeModal();
            reload();
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message ||
                (modalMode === "create"
                    ? "Tạo user thất bại"
                    : "Cập nhật user thất bại");

            messageApi.error(
                Array.isArray(errorMessage)
                    ? errorMessage.join(", ")
                    : errorMessage
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (record: IUser) => {
        try {
            const response = await usersService.remove(record.id);
            messageApi.success(response.message || "Xóa user thành công");
            reload();
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message || "Xóa user thất bại";
            messageApi.error(
                Array.isArray(errorMessage)
                    ? errorMessage.join(", ")
                    : errorMessage
            );
        }
    };

    const columns: ColumnsType<IUser> = useMemo(
        () => [
            {
                title: "Họ tên",
                dataIndex: "name",
                key: "name",
                width: 220,
            },
            {
                title: "Email",
                dataIndex: "email",
                key: "email",
                width: 260,
            },
            {
                title: "Số điện thoại",
                dataIndex: "phone",
                key: "phone",
                width: 160,
                render: (value?: string) => value || "-",
            },
            {
                title: "Kích hoạt",
                dataIndex: "isActive",
                key: "isActive",
                width: 120,
                render: (value: boolean) =>
                    value ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>,
            },
            {
                title: "Xác thực",
                dataIndex: "isVerified",
                key: "isVerified",
                width: 120,
                render: (value: boolean) =>
                    value ? <Tag color="blue">Verified</Tag> : <Tag>Pending</Tag>,
            },
            {
                title: "Ngày tạo",
                dataIndex: "createdAt",
                key: "createdAt",
                width: 180,
                render: (value?: string) =>
                    value ? new Date(value).toLocaleString("vi-VN") : "-",
            },
            {
                title: "Hành động",
                key: "actions",
                width: 320,
                render: (_, record) => (
                    <Space wrap>
                        {canUpdate ? (
                            <Button onClick={() => openEditModal(record)}>Sửa</Button>
                        ) : null}

                        {canUpdate && canViewRoles ? (
                            <Button onClick={() => openAssignRolesModal(record)}>
                                Gán role
                            </Button>
                        ) : null}

                        {canDelete ? (
                            <DeleteConfirmButton
                                title="Xóa user"
                                description={`Bạn có chắc muốn xóa user "${record.email}" không?`}
                                onConfirm={() => handleDelete(record)}
                            />
                        ) : null}
                    </Space>
                ),
            },
        ],
        [canUpdate, canDelete, canViewRoles]
    );

    if (!canView) {
        return (
            <Typography.Text type="danger">
                Bạn không có quyền xem danh sách user.
            </Typography.Text>
        );
    }

    return (
        <div>
            {contextHolder}

            <PageHeader
                title="Quản lý user"
                subtitle="Danh sách người dùng trong hệ thống"
                extra={
                    <Space wrap>
                        <Input.Search
                            allowClear
                            placeholder="Tìm theo tên, email, số điện thoại"
                            style={{ width: 300 }}
                            onSearch={onSearch}
                        />

                        {canCreate ? (
                            <Button type="primary" onClick={openCreateModal}>
                                Thêm user
                            </Button>
                        ) : null}
                    </Space>
                }
            />

            <Table<IUser>
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={data}
                scroll={{ x: 1200 }}
                pagination={{
                    current: page,
                    pageSize: limit,
                    total,
                    showSizeChanger: true,
                    onChange: onChangePage,
                }}
            />

            <UserFormModal
                open={modalOpen}
                mode={modalMode}
                initialValues={editingRecord}
                loading={submitting}
                onCancel={closeModal}
                onSubmit={handleSubmit}
            />

            <AssignRolesModal
                open={assignModalOpen}
                user={assigningUser}
                onCancel={closeAssignRolesModal}
                onSuccess={() => {
                    closeAssignRolesModal();
                    messageApi.success("Cập nhật role cho user thành công");
                }}
            />
        </div>
    );
}