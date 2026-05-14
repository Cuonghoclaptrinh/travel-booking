import { useEffect, useState } from "react";
import {
    Button,
    Card,
    Col,
    Empty,
    Image,
    Modal,
    Row,
    Space,
    Switch,
    Tag,
    Typography,
    Upload,
    message,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { RcFile } from "antd/es/upload";

import hotelsService from "../../../../services/admin/hotelsService";
import { IHotel, IHotelImage } from "../../../../types/hotel";

interface HotelImagesModalProps {
    open: boolean;
    hotel: IHotel | null;
    onCancel: () => void;
}

export default function HotelImagesModal({
    open,
    hotel,
    onCancel,
}: HotelImagesModalProps) {
    const [messageApi, contextHolder] = message.useMessage();

    const [loading, setLoading] = useState<boolean>(false);
    const [uploading, setUploading] = useState<boolean>(false);
    const [images, setImages] = useState<IHotelImage[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDefault, setIsDefault] = useState<boolean>(false);

    const fetchImages = async () => {
        if (!hotel) return;

        setLoading(true);
        try {
            const response = await hotelsService.getImages(hotel.id);
            setImages(response);
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message || "Không thể tải danh sách ảnh";
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
        if (open && hotel) {
            fetchImages();
        } else {
            setImages([]);
            setSelectedFile(null);
            setIsDefault(false);
        }
    }, [open, hotel]);

    const handleUpload = async () => {
        if (!hotel || !selectedFile) {
            messageApi.warning("Vui lòng chọn ảnh trước khi upload");
            return;
        }

        setUploading(true);
        try {
            await hotelsService.uploadImage(hotel.id, selectedFile, isDefault);
            messageApi.success("Upload ảnh thành công");
            setSelectedFile(null);
            setIsDefault(false);
            await fetchImages();
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message || "Upload ảnh thất bại";
            messageApi.error(
                Array.isArray(errorMessage)
                    ? errorMessage.join(", ")
                    : errorMessage
            );
        } finally {
            setUploading(false);
        }
    };

    const handleSetDefault = async (imageId: number) => {
        try {
            const response = await hotelsService.setDefaultImage(imageId);
            messageApi.success(response.message || "Đặt ảnh mặc định thành công");
            await fetchImages();
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message || "Không thể đặt ảnh mặc định";
            messageApi.error(
                Array.isArray(errorMessage)
                    ? errorMessage.join(", ")
                    : errorMessage
            );
        }
    };

    const handleDelete = async (imageId: number) => {
        try {
            const response = await hotelsService.deleteImage(imageId);
            messageApi.success(response.message || "Xóa ảnh thành công");
            await fetchImages();
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message || "Xóa ảnh thất bại";
            messageApi.error(
                Array.isArray(errorMessage)
                    ? errorMessage.join(", ")
                    : errorMessage
            );
        }
    };

    return (
        <>
            {contextHolder}

            <Modal
                title={hotel ? `Quản lý ảnh: ${hotel.name}` : "Quản lý ảnh khách sạn"}
                open={open}
                onCancel={onCancel}
                footer={null}
                width={1100}
                destroyOnHidden
            >
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                    <Card>
                        <Space direction="vertical" size={16} style={{ width: "100%" }}>
                            <Typography.Text strong>Upload ảnh mới</Typography.Text>

                            <Space wrap>
                                <Upload
                                    maxCount={1}
                                    beforeUpload={(file: RcFile) => {
                                        setSelectedFile(file);
                                        return false;
                                    }}
                                    showUploadList={{
                                        showRemoveIcon: true,
                                    }}
                                    onRemove={() => {
                                        setSelectedFile(null);
                                    }}
                                    accept=".jpg,.jpeg,.png,.webp"
                                >
                                    <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
                                </Upload>

                                <Space>
                                    <Typography.Text>Đặt làm ảnh mặc định</Typography.Text>
                                    <Switch checked={isDefault} onChange={setIsDefault} />
                                </Space>

                                <Button
                                    type="primary"
                                    loading={uploading}
                                    onClick={handleUpload}
                                >
                                    Upload
                                </Button>
                            </Space>
                        </Space>
                    </Card>

                    {images.length === 0 ? (
                        <Empty description={loading ? "Đang tải..." : "Chưa có ảnh nào"} />
                    ) : (
                        <Row gutter={[16, 16]}>
                            {images.map((image) => (
                                <Col xs={24} sm={12} md={8} lg={6} key={image.id}>
                                    <Card
                                        cover={
                                            <Image
                                                src={image.url}
                                                alt={`hotel-${image.id}`}
                                                style={{
                                                    height: 180,
                                                    objectFit: "cover",
                                                }}
                                            />
                                        }
                                        actions={[
                                            !image.isDefault ? (
                                                <Button
                                                    type="link"
                                                    onClick={() =>
                                                        handleSetDefault(image.id)
                                                    }
                                                >
                                                    Đặt mặc định
                                                </Button>
                                            ) : (
                                                <span />
                                            ),
                                            <Button
                                                type="link"
                                                danger
                                                onClick={() => handleDelete(image.id)}
                                            >
                                                Xóa
                                            </Button>,
                                        ]}
                                    >
                                        <Space direction="vertical" size={8}>
                                            <Typography.Text copyable={{ text: image.url }}>
                                                URL ảnh
                                            </Typography.Text>

                                            {image.isDefault ? (
                                                <Tag color="gold">Ảnh mặc định</Tag>
                                            ) : null}
                                        </Space>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    )}
                </Space>
            </Modal>
        </>
    );
}