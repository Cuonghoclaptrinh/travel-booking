import { useEffect, useMemo, useState } from "react";
import { Button, Input, Space, Table, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";

import PageHeader from "../../../components/common/PageHeader";
import DeleteConfirmButton from "../../../components/common/DeleteConfirmButton";
import { useTableQuery } from "../../../hooks/useTableQuery";
import { useAuth } from "../../../hooks/useAuth";
import { hasPermission } from "../../../utils/auth";
import amenitiesService from "../../../services/admin/amenitiesService";
import { CreateAmenityPayload, IAmenity } from "../../../types/amenity";
import AmenityFormModal from "./components/AmenityFormModal";

export default function AmenitiesPage() {
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

    const [data, setData] = useState<IAmenity[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);

    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [editingRecord, setEditingRecord] = useState<IAmenity | null>(null);

    const canView = hasPermission(user, "amenity.view");
    const canCreate = hasPermission(user, "amenity.create");
    const canUpdate = hasPermission(user, "amenity.update");
    const canDelete = hasPermission(user, "amenity.delete");

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await amenitiesService.getPaging({
                search: query.keyword,
                page: query.page,
                limit: query.limit,
            });

            setData(response.data);
            setTotal(response.total);
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message ||
                "Không thể tải danh sách tiện ích";
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

    const openEditModal = (record: IAmenity) => {
        setModalMode("edit");
        setEditingRecord(record);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingRecord(null);
    };

    const handleSubmit = async (values: CreateAmenityPayload) => {
        setSubmitting(true);
        try {
            if (modalMode === "create") {
                await amenitiesService.create(values);
                messageApi.success("Tạo tiện ích thành công");
            } else if (editingRecord) {
                await amenitiesService.update(editingRecord.id, values);
                messageApi.success("Cập nhật tiện ích thành công");
            }

            closeModal();
            reload();
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message ||
                (modalMode === "create"
                    ? "Tạo tiện ích thất bại"
                    : "Cập nhật tiện ích thất bại");

            messageApi.error(
                Array.isArray(errorMessage)
                    ? errorMessage.join(", ")
                    : errorMessage
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (record: IAmenity) => {
        try {
            const response = await amenitiesService.remove(record.id);
            messageApi.success(response.message || "Xóa tiện ích thành công");
            reload();
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message || "Xóa tiện ích thất bại";
            messageApi.error(
                Array.isArray(errorMessage)
                    ? errorMessage.join(", ")
                    : errorMessage
            );
        }
    };

    const columns: ColumnsType<IAmenity> = useMemo(
        () => [
            {
                title: "ID",
                dataIndex: "id",
                key: "id",
                width: 100,
            },
            {
                title: "Tên tiện ích",
                dataIndex: "name",
                key: "name",
            },
            {
                title: "Hành động",
                key: "actions",
                width: 220,
                render: (_, record) => (
                    <Space wrap>
                        {canUpdate ? (
                            <Button onClick={() => openEditModal(record)}>Sửa</Button>
                        ) : null}

                        {canDelete ? (
                            <DeleteConfirmButton
                                title="Xóa tiện ích"
                                description={`Bạn có chắc muốn xóa tiện ích "${record.name}" không?`}
                                onConfirm={() => handleDelete(record)}
                            />
                        ) : null}
                    </Space>
                ),
            },
        ],
        [canUpdate, canDelete]
    );

    return (
        <div>
            {contextHolder}

            <PageHeader
                title="Quản lý tiện ích"
                subtitle="Danh sách tiện ích trong hệ thống"
                extra={
                    <Space wrap>
                        <Input.Search
                            allowClear
                            placeholder="Tìm theo tên tiện ích"
                            style={{ width: 280 }}
                            onSearch={onSearch}
                        />

                        {canCreate ? (
                            <Button type="primary" onClick={openCreateModal}>
                                Thêm tiện ích
                            </Button>
                        ) : null}
                    </Space>
                }
            />

            {!canView ? (
                <Typography.Text type="warning">
                    Backend amenity hiện chưa gắn permission guard.
                    FE đang ẩn/hiện theo permission, nhưng API thật chỉ kiểm tra đăng nhập.
                </Typography.Text>
            ) : null}

            <Table<IAmenity>
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={data}
                pagination={{
                    current: page,
                    pageSize: limit,
                    total,
                    showSizeChanger: true,
                    onChange: onChangePage,
                }}
            />

            <AmenityFormModal
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