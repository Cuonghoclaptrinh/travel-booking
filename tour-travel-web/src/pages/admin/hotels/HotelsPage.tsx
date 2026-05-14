import { useEffect, useMemo, useState } from "react";
import {
    Button,
    Input,
    Select,
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

import destinationsService from "../../../services/admin/destinationsService";
import hotelsService from "../../../services/admin/hotelsService";

import { IDestination } from "../../../types/destination";
import { CreateHotelPayload, IHotel } from "../../../types/hotel";

import HotelFormModal from "./components/HotelFormModal";
import HotelImagesModal from "./components/HotelImagesModal";
import HotelAmenitiesModal from "./components/HotelAmenitiesModal";

export default function HotelsPage() {
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

    const [destinationFilter, setDestinationFilter] = useState<number | undefined>(
        undefined
    );
    const [starFilter, setStarFilter] = useState<number | undefined>(undefined);

    const [destinations, setDestinations] = useState<IDestination[]>([]);
    const [data, setData] = useState<IHotel[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);

    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [editingRecord, setEditingRecord] = useState<IHotel | null>(null);

    const [imagesModalOpen, setImagesModalOpen] = useState<boolean>(false);
    const [imageHotel, setImageHotel] = useState<IHotel | null>(null);

    const [amenitiesModalOpen, setAmenitiesModalOpen] = useState<boolean>(false);
    const [amenityHotel, setAmenityHotel] = useState<IHotel | null>(null);

    const canView = hasPermission(user, "hotel.view");
    const canCreate = hasPermission(user, "hotel.create");
    const canUpdate = hasPermission(user, "hotel.update");
    const canDelete = hasPermission(user, "hotel.delete");

    const fetchDestinations = async () => {
        try {
            const response = await destinationsService.getPaging({
                search: "",
                page: 1,
                limit: 1000,
            });
            setDestinations(response.data);
        } catch {
            // bỏ qua lỗi load filter options
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await hotelsService.getPaging({
                search: query.keyword,
                ...(destinationFilter !== undefined && {
                    destinationId: destinationFilter,
                }),
                ...(starFilter !== undefined && {
                    starRating: starFilter,
                }),
                page: query.page,
                limit: query.limit,
                sortBy: "id",
                sortOrder: "DESC",
            });

            setData(response.data);
            setTotal(response.total);
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message ||
                "Không thể tải danh sách khách sạn";
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
        fetchDestinations();
    }, []);

    useEffect(() => {
        fetchData();
    }, [page, limit, keyword, destinationFilter, starFilter, reloadKey]);

    const openCreateModal = () => {
        setModalMode("create");
        setEditingRecord(null);
        setModalOpen(true);
    };

    const openEditModal = (record: IHotel) => {
        setModalMode("edit");
        setEditingRecord(record);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingRecord(null);
    };

    const openImagesModal = (record: IHotel) => {
        setImageHotel(record);
        setImagesModalOpen(true);
    };

    const closeImagesModal = () => {
        setImageHotel(null);
        setImagesModalOpen(false);
    };

    const openAmenitiesModal = (record: IHotel) => {
        setAmenityHotel(record);
        setAmenitiesModalOpen(true);
    };

    const closeAmenitiesModal = () => {
        setAmenityHotel(null);
        setAmenitiesModalOpen(false);
    };

    const handleSubmit = async (values: CreateHotelPayload) => {
        setSubmitting(true);
        try {
            if (modalMode === "create") {
                await hotelsService.create(values);
                messageApi.success("Tạo khách sạn thành công");
            } else if (editingRecord) {
                await hotelsService.update(editingRecord.id, values);
                messageApi.success("Cập nhật khách sạn thành công");
            }

            closeModal();
            reload();
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message ||
                (modalMode === "create"
                    ? "Tạo khách sạn thất bại"
                    : "Cập nhật khách sạn thất bại");

            messageApi.error(
                Array.isArray(errorMessage)
                    ? errorMessage.join(", ")
                    : errorMessage
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (record: IHotel) => {
        try {
            const response = await hotelsService.remove(record.id);
            messageApi.success(response.message || "Xóa khách sạn thành công");
            reload();
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message || "Xóa khách sạn thất bại";
            messageApi.error(
                Array.isArray(errorMessage)
                    ? errorMessage.join(", ")
                    : errorMessage
            );
        }
    };

    const columns: ColumnsType<IHotel> = useMemo(
        () => [
            {
                title: "Tên khách sạn",
                dataIndex: "name",
                key: "name",
                width: 240,
            },
            {
                title: "Điểm đến",
                dataIndex: ["destination", "name"],
                key: "destination",
                width: 180,
                render: (_, record) => record.destination?.name || "-",
            },
            {
                title: "Số sao",
                dataIndex: "starRating",
                key: "starRating",
                width: 120,
                render: (value?: string | null) =>
                    value ? <Tag color="gold">{value} ★</Tag> : "-",
            },
            {
                title: "SĐT liên hệ",
                dataIndex: "contactPhone",
                key: "contactPhone",
                width: 150,
                render: (value?: string | null) => value || "-",
            },
            {
                title: "Địa chỉ",
                dataIndex: "address",
                key: "address",
                render: (value?: string | null) => value || "-",
            },
            {
                title: "Hành động",
                key: "actions",
                width: 420,
                render: (_, record) => (
                    <Space wrap>
                        <Button onClick={() => openImagesModal(record)}>
                            Quản lý ảnh
                        </Button>

                        <Button onClick={() => openAmenitiesModal(record)}>
                            Tiện ích
                        </Button>

                        {canUpdate ? (
                            <Button onClick={() => openEditModal(record)}>Sửa</Button>
                        ) : null}

                        {canDelete ? (
                            <DeleteConfirmButton
                                title="Xóa khách sạn"
                                description={`Bạn có chắc muốn xóa khách sạn "${record.name}" không?`}
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
                title="Quản lý khách sạn"
                subtitle="Danh sách khách sạn trong hệ thống"
                extra={
                    <Space wrap>
                        <Input.Search
                            allowClear
                            placeholder="Tìm theo tên, địa chỉ, điểm đến"
                            style={{ width: 280 }}
                            onSearch={onSearch}
                        />

                        <Select
                            allowClear
                            placeholder="Lọc theo điểm đến"
                            style={{ width: 220 }}
                            value={destinationFilter}
                            onChange={(value) => setDestinationFilter(value)}
                            options={destinations.map((item) => ({
                                label: item.name,
                                value: item.id,
                            }))}
                        />

                        <Select
                            allowClear
                            placeholder="Lọc theo số sao"
                            style={{ width: 160 }}
                            value={starFilter}
                            onChange={(value) => setStarFilter(value)}
                            options={[1, 2, 3, 4, 5].map((item) => ({
                                label: `${item} sao`,
                                value: item,
                            }))}
                        />

                        {canCreate ? (
                            <Button type="primary" onClick={openCreateModal}>
                                Thêm khách sạn
                            </Button>
                        ) : null}
                    </Space>
                }
            />

            {!canView ? (
                <Typography.Text type="warning">
                    Backend hotel hiện chưa gắn permission guard.
                    FE đang ẩn/hiện theo permission, nhưng API thật chỉ kiểm tra đăng nhập.
                </Typography.Text>
            ) : null}

            <Table<IHotel>
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={data}
                scroll={{ x: 1400 }}
                pagination={{
                    current: page,
                    pageSize: limit,
                    total,
                    showSizeChanger: true,
                    onChange: onChangePage,
                }}
            />

            <HotelFormModal
                open={modalOpen}
                mode={modalMode}
                initialValues={editingRecord}
                destinations={destinations}
                loading={submitting}
                onCancel={closeModal}
                onSubmit={handleSubmit}
            />

            <HotelImagesModal
                open={imagesModalOpen}
                hotel={imageHotel}
                onCancel={closeImagesModal}
            />

            <HotelAmenitiesModal
                open={amenitiesModalOpen}
                hotel={amenityHotel}
                onCancel={closeAmenitiesModal}
                onSuccess={() => {
                    closeAmenitiesModal();
                    messageApi.success("Cập nhật tiện ích khách sạn thành công");
                }}
            />
        </div>
    );
}