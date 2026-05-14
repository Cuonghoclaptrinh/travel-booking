// import { useEffect, useMemo, useState } from "react";
// import { Button, Input, Space, Table, Typography, message } from "antd";
// import type { ColumnsType } from "antd/es/table";

// import PageHeader from "../../../components/common/PageHeader";
// import DeleteConfirmButton from "../../../components/common/DeleteConfirmButton";
// import { useTableQuery } from "../../../hooks/useTableQuery";
// import destinationsService from "../../../services/admin/destinationsService";
// import { hasPermission } from "../../../utils/auth";
// import { useAuth } from "../../../hooks/useAuth";
// import {
//     CreateDestinationPayload,
//     IDestination,
// } from "../../../types/destination";
// import DestinationFormModal from "./components/DestinationFormModal";
// import DestinationImagesModal from "./components/DestinationImagesModal";

// export default function DestinationsPage() {
//     const { user } = useAuth();
//     const [messageApi, contextHolder] = message.useMessage();

//     const {
//         page,
//         limit,
//         keyword,
//         query,
//         reloadKey,
//         onSearch,
//         onChangePage,
//         reload,
//     } = useTableQuery({
//         defaultPage: 1,
//         defaultLimit: 10,
//     });

//     const [data, setData] = useState<IDestination[]>([]);
//     const [total, setTotal] = useState<number>(0);
//     const [loading, setLoading] = useState<boolean>(false);

//     const [modalOpen, setModalOpen] = useState<boolean>(false);
//     const [modalMode, setModalMode] = useState<"create" | "edit">("create");
//     const [submitting, setSubmitting] = useState<boolean>(false);
//     const [editingRecord, setEditingRecord] = useState<IDestination | null>(null);

//     const [imagesModalOpen, setImagesModalOpen] = useState<boolean>(false);
//     const [imageDestination, setImageDestination] = useState<IDestination | null>(null);

//     const canView = hasPermission(user, "destination.view");
//     const canCreate = hasPermission(user, "destination.create");
//     const canUpdate = hasPermission(user, "destination.update");
//     const canDelete = hasPermission(user, "destination.delete");

//     const fetchData = async () => {
//         setLoading(true);
//         try {
//             const response = await destinationsService.getPaging({
//                 search: query.keyword,
//                 page: query.page,
//                 limit: query.limit,
//             });

//             setData(response.data);
//             setTotal(response.total);
//         } catch (error: any) {
//             const errorMessage =
//                 error?.response?.data?.message ||
//                 "Không thể tải danh sách điểm đến";
//             messageApi.error(
//                 Array.isArray(errorMessage)
//                     ? errorMessage.join(", ")
//                     : errorMessage
//             );
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchData();
//     }, [page, limit, keyword, reloadKey]);

//     const openCreateModal = () => {
//         setModalMode("create");
//         setEditingRecord(null);
//         setModalOpen(true);
//     };

//     const openEditModal = (record: IDestination) => {
//         setModalMode("edit");
//         setEditingRecord(record);
//         setModalOpen(true);
//     };

//     const closeModal = () => {
//         setModalOpen(false);
//         setEditingRecord(null);
//     };

//     const openImagesModal = (record: IDestination) => {
//         setImageDestination(record);
//         setImagesModalOpen(true);
//     };

//     const closeImagesModal = () => {
//         setImagesModalOpen(false);
//         setImageDestination(null);
//     };

//     const handleSubmit = async (values: CreateDestinationPayload) => {
//         setSubmitting(true);
//         try {
//             if (modalMode === "create") {
//                 await destinationsService.create(values);
//                 messageApi.success("Tạo điểm đến thành công");
//             } else if (editingRecord) {
//                 await destinationsService.update(editingRecord.id, values);
//                 messageApi.success("Cập nhật điểm đến thành công");
//             }

//             closeModal();
//             reload();
//         } catch (error: any) {
//             const errorMessage =
//                 error?.response?.data?.message ||
//                 (modalMode === "create"
//                     ? "Tạo điểm đến thất bại"
//                     : "Cập nhật điểm đến thất bại");

//             messageApi.error(
//                 Array.isArray(errorMessage)
//                     ? errorMessage.join(", ")
//                     : errorMessage
//             );
//         } finally {
//             setSubmitting(false);
//         }
//     };

//     const handleDelete = async (record: IDestination) => {
//         try {
//             const response = await destinationsService.remove(record.id);
//             messageApi.success(response.message || "Xóa điểm đến thành công");
//             reload();
//         } catch (error: any) {
//             const errorMessage =
//                 error?.response?.data?.message || "Xóa điểm đến thất bại";
//             messageApi.error(
//                 Array.isArray(errorMessage)
//                     ? errorMessage.join(", ")
//                     : errorMessage
//             );
//         }
//     };

//     const columns: ColumnsType<IDestination> = useMemo(
//         () => [
//             {
//                 title: "Tên điểm đến",
//                 dataIndex: "name",
//                 key: "name",
//                 width: 220,
//             },
//             {
//                 title: "Quốc gia",
//                 dataIndex: "country",
//                 key: "country",
//                 width: 180,
//                 render: (value?: string) => value || "-",
//             },
//             {
//                 title: "Slug",
//                 dataIndex: "slug",
//                 key: "slug",
//                 width: 220,
//                 render: (value: string) => <Typography.Text code>{value}</Typography.Text>,
//             },
//             {
//                 title: "Mô tả",
//                 dataIndex: "description",
//                 key: "description",
//                 render: (value?: string) => value || "-",
//             },
//             {
//                 title: "Hành động",
//                 key: "actions",
//                 width: 340,
//                 render: (_, record) => (
//                     <Space wrap>
//                         <Button onClick={() => openImagesModal(record)}>
//                             Quản lý ảnh
//                         </Button>

//                         {canUpdate ? (
//                             <Button onClick={() => openEditModal(record)}>Sửa</Button>
//                         ) : null}

//                         {canDelete ? (
//                             <DeleteConfirmButton
//                                 title="Xóa điểm đến"
//                                 description={`Bạn có chắc muốn xóa điểm đến "${record.name}" không?`}
//                                 onConfirm={() => handleDelete(record)}
//                             />
//                         ) : null}
//                     </Space>
//                 ),
//             },
//         ],
//         [canUpdate, canDelete]
//     );

//     return (
//         <div>
//             {contextHolder}

//             <PageHeader
//                 title="Quản lý điểm đến"
//                 subtitle="Danh sách điểm đến trong hệ thống"
//                 extra={
//                     <Space wrap>
//                         <Input.Search
//                             allowClear
//                             placeholder="Tìm theo tên hoặc quốc gia"
//                             style={{ width: 280 }}
//                             onSearch={onSearch}
//                         />

//                         {canCreate ? (
//                             <Button type="primary" onClick={openCreateModal}>
//                                 Thêm điểm đến
//                             </Button>
//                         ) : null}
//                     </Space>
//                 }
//             />

//             {!canView ? (
//                 <Typography.Text type="warning">
//                     Backend destination hiện chưa gắn permission guard.
//                     FE đang ẩn/hiện theo permission, nhưng API thật chỉ kiểm tra đăng nhập.
//                 </Typography.Text>
//             ) : null}

//             <Table<IDestination>
//                 rowKey="id"
//                 loading={loading}
//                 columns={columns}
//                 dataSource={data}
//                 scroll={{ x: 1200 }}
//                 pagination={{
//                     current: page,
//                     pageSize: limit,
//                     total,
//                     showSizeChanger: true,
//                     onChange: onChangePage,
//                 }}
//             />

//             <DestinationFormModal
//                 open={modalOpen}
//                 mode={modalMode}
//                 initialValues={editingRecord}
//                 loading={submitting}
//                 onCancel={closeModal}
//                 onSubmit={handleSubmit}
//             />

//             <DestinationImagesModal
//                 open={imagesModalOpen}
//                 destination={imageDestination}
//                 onCancel={closeImagesModal}
//             />
//         </div>
//     );
// }

import { useEffect, useMemo, useState } from "react";
import {
    Button,
    Image,
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
import destinationsService from "../../../services/admin/destinationsService";
import { hasPermission } from "../../../utils/auth";
import { useAuth } from "../../../hooks/useAuth";
import {
    CreateDestinationPayload,
    DestinationRegion,
    DestinationType,
    IDestination,
    destinationRegionLabel,
    destinationRegionOptions,
    destinationTypeLabel,
    destinationTypeOptions,
} from "../../../types/destination";
import DestinationFormModal from "./components/DestinationFormModal";
import DestinationImagesModal from "./components/DestinationImagesModal";

export default function DestinationsPage() {
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

    const [data, setData] = useState<IDestination[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);

    const [region, setRegion] = useState<DestinationRegion | undefined>();
    const [destinationType, setDestinationType] = useState<DestinationType | undefined>();
    const [isFeatured, setIsFeatured] = useState<boolean | undefined>();

    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [editingRecord, setEditingRecord] = useState<IDestination | null>(null);

    const [imagesModalOpen, setImagesModalOpen] = useState<boolean>(false);
    const [imageDestination, setImageDestination] = useState<IDestination | null>(null);

    const canView = hasPermission(user, "destination.view");
    const canCreate = hasPermission(user, "destination.create");
    const canUpdate = hasPermission(user, "destination.update");
    const canDelete = hasPermission(user, "destination.delete");

    const fetchData = async () => {
        setLoading(true);

        try {
            const params = {
                search: query.keyword,
                page: query.page,
                limit: query.limit,
                ...(region ? { region } : {}),
                ...(destinationType ? { destinationType } : {}),
                ...(isFeatured !== undefined ? { isFeatured } : {}),
            };

            const response = await destinationsService.getPaging(params);

            /**
             * Nếu common PaginatedResponse của bạn đang là { data, total }
             * thì response.data vẫn chạy.
             *
             * Nếu BE mới trả { items, total, page, limit, totalPages }
             * thì response.items sẽ chạy.
             */
            const pagingResponse = response as typeof response & {
                items?: IDestination[];
                data?: IDestination[];
            };

            setData(pagingResponse.items ?? pagingResponse.data ?? []);
            setTotal(response.total ?? 0);
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message ||
                "Không thể tải danh sách điểm đến";

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
    }, [
        page,
        limit,
        keyword,
        reloadKey,
        region,
        destinationType,
        isFeatured,
    ]);

    const openCreateModal = () => {
        setModalMode("create");
        setEditingRecord(null);
        setModalOpen(true);
    };

    const openEditModal = (record: IDestination) => {
        setModalMode("edit");
        setEditingRecord(record);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingRecord(null);
    };

    const openImagesModal = (record: IDestination) => {
        setImageDestination(record);
        setImagesModalOpen(true);
    };

    const closeImagesModal = () => {
        setImagesModalOpen(false);
        setImageDestination(null);
    };

    const handleSubmit = async (values: CreateDestinationPayload) => {
        setSubmitting(true);

        try {
            if (modalMode === "create") {
                await destinationsService.create(values);
                messageApi.success("Tạo điểm đến thành công");
            } else if (editingRecord) {
                await destinationsService.update(editingRecord.id, values);
                messageApi.success("Cập nhật điểm đến thành công");
            }

            closeModal();
            reload();
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message ||
                (modalMode === "create"
                    ? "Tạo điểm đến thất bại"
                    : "Cập nhật điểm đến thất bại");

            messageApi.error(
                Array.isArray(errorMessage)
                    ? errorMessage.join(", ")
                    : errorMessage
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (record: IDestination) => {
        try {
            const response = await destinationsService.remove(record.id);
            messageApi.success(response.message || "Xóa điểm đến thành công");
            reload();
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message || "Xóa điểm đến thất bại";

            messageApi.error(
                Array.isArray(errorMessage)
                    ? errorMessage.join(", ")
                    : errorMessage
            );
        }
    };

    const handleChangeRegion = (value?: DestinationRegion) => {
        setRegion(value);
        onChangePage(1, limit);
    };

    const handleChangeDestinationType = (value?: DestinationType) => {
        setDestinationType(value);
        onChangePage(1, limit);
    };

    const handleChangeFeatured = (value?: boolean) => {
        setIsFeatured(value);
        onChangePage(1, limit);
    };

    const columns: ColumnsType<IDestination> = useMemo(
        () => [
            {
                title: "Ảnh",
                dataIndex: "defaultImageUrl",
                key: "defaultImageUrl",
                width: 90,
                render: (url?: string | null) =>
                    url ? (
                        <Image
                            src={url}
                            alt="Ảnh điểm đến"
                            width={64}
                            height={44}
                            style={{
                                objectFit: "cover",
                                borderRadius: 8,
                            }}
                        />
                    ) : (
                        <Typography.Text type="secondary">Chưa có</Typography.Text>
                    ),
            },
            {
                title: "Tên điểm đến",
                dataIndex: "name",
                key: "name",
                width: 190,
                render: (value: string, record) => (
                    <Space direction="vertical" size={0}>
                        <Typography.Text strong>{value}</Typography.Text>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {record.country || "-"}
                        </Typography.Text>
                    </Space>
                ),
            },
            {
                title: "Khu vực",
                dataIndex: "region",
                key: "region",
                width: 140,
                render: (value?: DestinationRegion) =>
                    value ? (
                        <Tag color="blue">{destinationRegionLabel[value]}</Tag>
                    ) : (
                        "-"
                    ),
            },
            {
                title: "Loại",
                dataIndex: "destinationType",
                key: "destinationType",
                width: 130,
                render: (value?: DestinationType) =>
                    value ? (
                        <Tag color="green">{destinationTypeLabel[value]}</Tag>
                    ) : (
                        "-"
                    ),
            },
            {
                title: "Slug",
                dataIndex: "slug",
                key: "slug",
                width: 180,
                render: (value: string) => (
                    <Typography.Text code>{value}</Typography.Text>
                ),
            },
            {
                title: "Trang chủ",
                dataIndex: "isFeatured",
                key: "isFeatured",
                width: 110,
                render: (value?: boolean) =>
                    value ? <Tag color="gold">Nổi bật</Tag> : <Tag>Không</Tag>,
            },
            {
                title: "Thứ tự",
                dataIndex: "displayOrder",
                key: "displayOrder",
                width: 90,
                align: "center",
                render: (value?: number) => value ?? 0,
            },
            {
                title: "Mô tả",
                dataIndex: "description",
                key: "description",
                ellipsis: true,
                render: (value?: string) => value || "-",
            },
            {
                title: "Hành động",
                key: "actions",
                width: 300,
                fixed: "right",
                render: (_, record) => (
                    <Space wrap>
                        <Button onClick={() => openImagesModal(record)}>
                            Quản lý ảnh
                        </Button>

                        {canUpdate ? (
                            <Button onClick={() => openEditModal(record)}>
                                Sửa
                            </Button>
                        ) : null}

                        {canDelete ? (
                            <DeleteConfirmButton
                                title="Xóa điểm đến"
                                description={`Bạn có chắc muốn xóa điểm đến "${record.name}" không?`}
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
                title="Quản lý điểm đến"
                subtitle="Danh sách điểm đến trong hệ thống"
                extra={
                    <Space wrap>
                        <Input.Search
                            allowClear
                            placeholder="Tìm theo tên hoặc quốc gia"
                            style={{ width: 260 }}
                            onSearch={onSearch}
                        />

                        <Select
                            allowClear
                            placeholder="Khu vực"
                            style={{ width: 160 }}
                            options={destinationRegionOptions}
                            value={region}
                            onChange={handleChangeRegion}
                        />

                        <Select
                            allowClear
                            placeholder="Loại điểm đến"
                            style={{ width: 160 }}
                            options={destinationTypeOptions}
                            value={destinationType}
                            onChange={handleChangeDestinationType}
                        />

                        <Select
                            allowClear
                            placeholder="Trang chủ"
                            style={{ width: 150 }}
                            options={[
                                { label: "Nổi bật", value: true },
                                { label: "Không nổi bật", value: false },
                            ]}
                            value={isFeatured}
                            onChange={handleChangeFeatured}
                        />

                        {canCreate ? (
                            <Button type="primary" onClick={openCreateModal}>
                                Thêm điểm đến
                            </Button>
                        ) : null}
                    </Space>
                }
            />

            {!canView ? (
                <Typography.Text type="warning">
                    Bạn không có quyền xem danh sách điểm đến.
                </Typography.Text>
            ) : (
                <Table<IDestination>
                    rowKey="id"
                    loading={loading}
                    columns={columns}
                    dataSource={data}
                    scroll={{ x: 1450 }}
                    pagination={{
                        current: page,
                        pageSize: limit,
                        total,
                        showSizeChanger: true,
                        showTotal: (totalRows) => `Tổng ${totalRows} điểm đến`,
                        onChange: onChangePage,
                    }}
                />
            )}

            <DestinationFormModal
                open={modalOpen}
                mode={modalMode}
                initialValues={editingRecord}
                loading={submitting}
                onCancel={closeModal}
                onSubmit={handleSubmit}
            />

            <DestinationImagesModal
                open={imagesModalOpen}
                destination={imageDestination}
                onCancel={closeImagesModal}
                onChanged={reload}
            />
        </div>
    );
}