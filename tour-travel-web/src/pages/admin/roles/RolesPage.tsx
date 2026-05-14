import { useEffect, useMemo, useState } from "react";
import {
    Button,
    Input,
    message,
    Space,
    Switch,
    Table,
    Tag,
    Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";

import PageHeader from "../../../components/common/PageHeader";
import DeleteConfirmButton from "../../../components/common/DeleteConfirmButton";
import { useTableQuery } from "../../../hooks/useTableQuery";
import { useAuth } from "../../../hooks/useAuth";
import { hasPermission } from "../../../utils/auth";
import rolesService from "../../../services/admin/rolesService";
import { CreateRolePayload, IRole } from "../../../types/role";
import RoleFormModal from "./components/RoleFormModal";
import AssignPermissionsModal from "./components/AssignPermissionsModal";

export default function RolesPage() {
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

    const [data, setData] = useState<IRole[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);

    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [editingRecord, setEditingRecord] = useState<IRole | null>(null);

    const [assignModalOpen, setAssignModalOpen] = useState<boolean>(false);
    const [assigningRole, setAssigningRole] = useState<IRole | null>(null);

    const canView = hasPermission(user, "role.view");
    const canCreate = hasPermission(user, "role.create");
    const canUpdate = hasPermission(user, "role.update");
    const canDelete = hasPermission(user, "role.delete");
    const canViewPermissions = hasPermission(user, "permission.view");

    const fetchData = async () => {
        if (!canView) return;

        setLoading(true);
        try {
            const response = await rolesService.getPaging(query);
            setData(response.data);
            setTotal(response.total);
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message || "Không thể tải danh sách role";
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

    const openEditModal = (record: IRole) => {
        setModalMode("edit");
        setEditingRecord(record);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingRecord(null);
    };

    const openAssignPermissionsModal = (record: IRole) => {
        setAssigningRole(record);
        setAssignModalOpen(true);
    };

    const closeAssignPermissionsModal = () => {
        setAssignModalOpen(false);
        setAssigningRole(null);
    };

    const handleSubmit = async (values: CreateRolePayload) => {
        setSubmitting(true);
        try {
            if (modalMode === "create") {
                await rolesService.create(values);
                messageApi.success("Tạo role thành công");
            } else if (editingRecord) {
                await rolesService.update(editingRecord.id, values);
                messageApi.success("Cập nhật role thành công");
            }

            closeModal();
            reload();
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message ||
                (modalMode === "create"
                    ? "Tạo role thất bại"
                    : "Cập nhật role thất bại");

            messageApi.error(
                Array.isArray(errorMessage)
                    ? errorMessage.join(", ")
                    : errorMessage
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (record: IRole) => {
        try {
            const response = await rolesService.remove(record.id);
            messageApi.success(response.message || "Xóa role thành công");
            reload();
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message || "Xóa role thất bại";
            messageApi.error(
                Array.isArray(errorMessage)
                    ? errorMessage.join(", ")
                    : errorMessage
            );
        }
    };

    const columns: ColumnsType<IRole> = useMemo(
        () => [
            {
                title: "Mã",
                dataIndex: "code",
                key: "code",
                width: 180,
                render: (value: string) => (
                    <Typography.Text code>{value}</Typography.Text>
                ),
            },
            {
                title: "Tên",
                dataIndex: "name",
                key: "name",
                width: 220,
            },
            {
                title: "Mô tả",
                dataIndex: "description",
                key: "description",
                render: (value?: string) => value || "-",
            },
            {
                title: "Hệ thống",
                dataIndex: "isSystem",
                key: "isSystem",
                width: 120,
                render: (value: boolean) =>
                    value ? <Tag color="gold">System</Tag> : <Tag>Normal</Tag>,
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

                        {canUpdate && canViewPermissions ? (
                            <Button onClick={() => openAssignPermissionsModal(record)}>
                                Gán permission
                            </Button>
                        ) : null}

                        {canDelete ? (
                            <DeleteConfirmButton
                                title="Xóa role"
                                description={
                                    record.isSystem
                                        ? "Role hệ thống không được xóa"
                                        : `Bạn có chắc muốn xóa role "${record.code}" không?`
                                }
                                onConfirm={() => handleDelete(record)}
                                disabled={record.isSystem}
                            />
                        ) : null}
                    </Space>
                ),
            },
        ],
        [canUpdate, canDelete, canViewPermissions]
    );

    if (!canView) {
        return (
            <Typography.Text type="danger">
                Bạn không có quyền xem danh sách role.
            </Typography.Text>
        );
    }

    return (
        <div>
            {contextHolder}

            <PageHeader
                title="Quản lý role"
                subtitle="Danh sách role trong hệ thống"
                extra={
                    <Space wrap>
                        <Input.Search
                            allowClear
                            placeholder="Tìm theo code, tên, mô tả"
                            style={{ width: 280 }}
                            onSearch={onSearch}
                        />

                        {canCreate ? (
                            <Button type="primary" onClick={openCreateModal}>
                                Thêm role
                            </Button>
                        ) : null}
                    </Space>
                }
            />

            <Table<IRole>
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={data}
                scroll={{ x: 1100 }}
                pagination={{
                    current: page,
                    pageSize: limit,
                    total,
                    showSizeChanger: true,
                    onChange: onChangePage,
                }}
            />

            <RoleFormModal
                open={modalOpen}
                mode={modalMode}
                initialValues={editingRecord}
                loading={submitting}
                onCancel={closeModal}
                onSubmit={handleSubmit}
            />

            <AssignPermissionsModal
                open={assignModalOpen}
                role={assigningRole}
                onCancel={closeAssignPermissionsModal}
                onSuccess={() => {
                    closeAssignPermissionsModal();
                    messageApi.success("Cập nhật permission cho role thành công");
                }}
            />
        </div>
    );
}