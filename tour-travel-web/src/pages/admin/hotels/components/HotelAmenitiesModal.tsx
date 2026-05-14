import { useEffect, useMemo, useState } from "react";
import {
    Input,
    Modal,
    Space,
    Table,
    Typography,
    message,
} from "antd";
import type { ColumnsType } from "antd/es/table";

import amenitiesService from "../../../../services/admin/amenitiesService";
import hotelsService from "../../../../services/admin/hotelsService";
import { IAmenity } from "../../../../types/amenity";
import { IHotel } from "../../../../types/hotel";

interface HotelAmenitiesModalProps {
    open: boolean;
    hotel: IHotel | null;
    onCancel: () => void;
    onSuccess: () => void;
}

export default function HotelAmenitiesModal({
    open,
    hotel,
    onCancel,
    onSuccess,
}: HotelAmenitiesModalProps) {
    const [messageApi, contextHolder] = message.useMessage();

    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [keyword, setKeyword] = useState<string>("");

    const [allAmenities, setAllAmenities] = useState<IAmenity[]>([]);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    const fetchData = async () => {
        if (!open || !hotel) return;

        setLoading(true);
        try {
            const [allResponse, assignedResponse] = await Promise.all([
                amenitiesService.getPaging({
                    page: 1,
                    limit: 1000,
                    search: "",
                }),
                hotelsService.getAmenities(hotel.id),
            ]);

            setAllAmenities(allResponse.data);
            setSelectedRowKeys(
                assignedResponse.map((item) => item.amenityId)
            );
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message || "Không thể tải danh sách tiện ích";
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
    }, [open, hotel]);

    const filteredAmenities = useMemo(() => {
        const normalizedKeyword = keyword.trim().toLowerCase();

        if (!normalizedKeyword) return allAmenities;

        return allAmenities.filter((item) =>
            item.name.toLowerCase().includes(normalizedKeyword)
        );
    }, [allAmenities, keyword]);

    const columns: ColumnsType<IAmenity> = [
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
    ];

    const handleSave = async () => {
        if (!hotel) return;

        setSaving(true);
        try {
            const amenityIds = selectedRowKeys
                .map((item) => Number(item))
                .filter((item) => Number.isFinite(item));

            const response = await hotelsService.replaceAmenities(hotel.id, {
                amenityIds,
            });

            messageApi.success(
                response.message || "Cập nhật tiện ích khách sạn thành công"
            );
            onSuccess();
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message ||
                "Cập nhật tiện ích khách sạn thất bại";
            messageApi.error(
                Array.isArray(errorMessage)
                    ? errorMessage.join(", ")
                    : errorMessage
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            {contextHolder}

            <Modal
                title={hotel ? `Tiện ích khách sạn: ${hotel.name}` : "Tiện ích khách sạn"}
                open={open}
                onCancel={onCancel}
                onOk={handleSave}
                okText="Lưu"
                cancelText="Hủy"
                confirmLoading={saving}
                width={900}
                destroyOnHidden
            >
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                    <Input.Search
                        allowClear
                        placeholder="Tìm tiện ích"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />

                    <Table<IAmenity>
                        rowKey="id"
                        loading={loading}
                        columns={columns}
                        dataSource={filteredAmenities}
                        pagination={{ pageSize: 8 }}
                        rowSelection={{
                            selectedRowKeys,
                            onChange: setSelectedRowKeys,
                        }}
                    />
                </Space>
            </Modal>
        </>
    );
}