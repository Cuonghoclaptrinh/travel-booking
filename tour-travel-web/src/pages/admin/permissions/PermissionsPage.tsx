import { useEffect, useMemo, useState } from "react";
import {
    Button,
    Input,
    message,
    Space,
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
import permissionsService from "../../../services/admin/permissionsService";
import {
    CreatePermissionPayload,
    IPermission,
} from "../../../types/permission";
import PermissionFormModal from "./permissions/PermissionFormModal"

export default function PermissionsPage() {
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

    const [moduleFilter, setModuleFilter] = useState<string>("");
    const [data, setData] = useState<IPermission[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);

    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [editingRecord, setEditingRecord] = useState<IPermission | null>(null);

    const canView = hasPermission(user, "permission.view");
    const canCreate = hasPermission(user, "permission.create");
    const canUpdate = hasPermission(user, "permission.update");
    const canDelete = hasPermission(user, "permission.delete");

    const fetchData = async () => {
        if (!canView) return;

        setLoading(true);
        try {
            const response = await permissionsService.getPaging({
                ...query,
                ...(moduleFilter.trim() ? { module: moduleFilter.trim() } : {}),
            });

            setData(response.data);
            setTotal(response.total);
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message || "Không thể tải danh sách permission";
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
    }, [page, limit, keyword, moduleFilter, reloadKey]);

    const openCreateModal = () => {
        setModalMode("create");
        setEditingRecord(null);
        setModalOpen(true);
    };

    const openEditModal = (record: IPermission) => {
        setModalMode("edit");
        setEditingRecord(record);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingRecord(null);
    };

    const handleSubmit = async (values: CreatePermissionPayload) => {
        setSubmitting(true);
        try {
            if (modalMode === "create") {
                await permissionsService.create(values);
                messageApi.success("Tạo permission thành công");
            } else if (editingRecord) {
                await permissionsService.update(editingRecord.id, values);
                messageApi.success("Cập nhật permission thành công");
            }

            closeModal();
            reload();
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message ||
                (modalMode === "create"
                    ? "Tạo permission thất bại"
                    : "Cập nhật permission thất bại");

            messageApi.error(
                Array.isArray(errorMessage)
                    ? errorMessage.join(", ")
                    : errorMessage
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (record: IPermission) => {
        try {
            const response = await permissionsService.remove(record.id);
            messageApi.success(response.message || "Xóa permission thành công");
            reload();
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message || "Xóa permission thất bại";
            messageApi.error(
                Array.isArray(errorMessage)
                    ? errorMessage.join(", ")
                    : errorMessage
            );
        }
    };

    const columns: ColumnsType<IPermission> = useMemo(
        () => [
            {
                title: "Mã",
                dataIndex: "code",
                key: "code",
                width: 220,
                render: (value: string) => (
                    <Typography.Text code>{value}</Typography.Text>
                ),
            },
            {
                title: "Tên",
                dataIndex: "name",
                key: "name",
                width: 240,
            },
            {
                title: "Module",
                dataIndex: "module",
                key: "module",
                width: 160,
                render: (value: string) => <Tag color="blue">{value}</Tag>,
            },
            {
                title: "Mô tả",
                dataIndex: "description",
                key: "description",
                render: (value?: string) => value || "-",
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
                width: 180,
                render: (_, record) => (
                    <Space>
                        {canUpdate ? (
                            <Button onClick={() => openEditModal(record)}>Sửa</Button>
                        ) : null}

                        {canDelete ? (
                            <DeleteConfirmButton
                                title="Xóa permission"
                                description={`Bạn có chắc muốn xóa permission "${record.code}" không?`}
                                onConfirm={() => handleDelete(record)}
                            />
                        ) : null}
                    </Space>
                ),
            },
        ],
        [canUpdate, canDelete]
    );

    if (!canView) {
        return (
            <Typography.Text type="danger">
                Bạn không có quyền xem danh sách permission.
            </Typography.Text>
        );
    }

    return (
        <div>
            {contextHolder}

            <PageHeader
                title="Quản lý permission"
                subtitle="Danh sách permission trong hệ thống"
                extra={
                    <Space wrap>
                        <Input.Search
                            allowClear
                            placeholder="Tìm theo code, tên, mô tả"
                            style={{ width: 280 }}
                            onSearch={onSearch}
                        />

                        <Input
                            placeholder="Lọc theo module"
                            value={moduleFilter}
                            onChange={(e) => setModuleFilter(e.target.value)}
                            style={{ width: 220 }}
                        />

                        {canCreate ? (
                            <Button type="primary" onClick={openCreateModal}>
                                Thêm permission
                            </Button>
                        ) : null}
                    </Space>
                }
            />

            <Table<IPermission>
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

            <PermissionFormModal
                open={modalOpen}
                mode={modalMode}
                initialValues={editingRecord}
                loading={submitting}
                onCancel={closeModal}
                onSubmit={handleSubmit}
            />
        </div>
    );
}