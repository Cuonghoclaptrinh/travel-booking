import { Form, Input, InputNumber, Modal, Select } from "antd";
import { useEffect } from "react";
import { IDestination } from "../../../../types/destination";
import { CreateHotelPayload, IHotel } from "../../../../types/hotel";

interface HotelFormModalProps {
    open: boolean;
    loading?: boolean;
    mode: "create" | "edit";
    initialValues?: IHotel | null;
    destinations: IDestination[];
    onCancel: () => void;
    onSubmit: (values: CreateHotelPayload) => Promise<void> | void;
}

interface HotelFormValues {
    destinationId: number;
    name: string;
    address?: string;
    starRating?: number;
    latitude?: number;
    longitude?: number;
    contactPhone?: string;
}

export default function HotelFormModal({
    open,
    loading = false,
    mode,
    initialValues,
    destinations,
    onCancel,
    onSubmit,
}: HotelFormModalProps) {
    const [form] = Form.useForm<HotelFormValues>();

    useEffect(() => {
        if (!open) {
            form.resetFields();
            return;
        }

        if (initialValues) {
            form.setFieldsValue({
                destinationId: initialValues.destinationId,
                name: initialValues.name,
                address: initialValues.address ?? "",
                ...(initialValues.starRating && {
                    starRating: Number(initialValues.starRating),
                }),
                ...(initialValues.latitude && {
                    latitude: Number(initialValues.latitude),
                }),
                ...(initialValues.longitude && {
                    longitude: Number(initialValues.longitude),
                }),
                contactPhone: initialValues.contactPhone ?? "",
            });
        } else {
            form.resetFields();
        }
    }, [open, initialValues, form]);

    const handleOk = async () => {
        const values = await form.validateFields();

        const payload: CreateHotelPayload = {
            destinationId: values.destinationId,
            name: values.name.trim(),
            ...(values.address?.trim() ? { address: values.address.trim() } : {}),
            ...(values.starRating !== undefined ? { starRating: values.starRating } : {}),
            ...(values.latitude !== undefined ? { latitude: values.latitude } : {}),
            ...(values.longitude !== undefined ? { longitude: values.longitude } : {}),
            ...(values.contactPhone?.trim()
                ? { contactPhone: values.contactPhone.trim() }
                : {}),
        };

        await onSubmit(payload);
    };

    return (
        <Modal
            title={mode === "create" ? "Thêm khách sạn" : "Cập nhật khách sạn"}
            open={open}
            onCancel={onCancel}
            onOk={handleOk}
            okText={mode === "create" ? "Tạo mới" : "Cập nhật"}
            cancelText="Hủy"
            confirmLoading={loading}
            destroyOnHidden
            width={760}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    label="Điểm đến"
                    name="destinationId"
                    rules={[{ required: true, message: "Vui lòng chọn điểm đến" }]}
                >
                    <Select
                        placeholder="Chọn điểm đến"
                        options={destinations.map((item) => ({
                            label: item.name,
                            value: item.id,
                        }))}
                        showSearch
                        optionFilterProp="label"
                    />
                </Form.Item>

                <Form.Item
                    label="Tên khách sạn"
                    name="name"
                    rules={[
                        { required: true, message: "Vui lòng nhập tên khách sạn" },
                        { max: 255, message: "Tối đa 255 ký tự" },
                    ]}
                >
                    <Input placeholder="Ví dụ: InterContinental Danang" />
                </Form.Item>

                <Form.Item label="Địa chỉ" name="address">
                    <Input.TextArea rows={3} placeholder="Nhập địa chỉ" />
                </Form.Item>

                <Form.Item label="Số sao" name="starRating">
                    <InputNumber
                        min={0}
                        max={5}
                        step={0.1}
                        style={{ width: "100%" }}
                        placeholder="Ví dụ: 4.5"
                    />
                </Form.Item>

                <Form.Item label="Vĩ độ" name="latitude">
                    <InputNumber
                        min={-90}
                        max={90}
                        step={0.00000001}
                        style={{ width: "100%" }}
                    />
                </Form.Item>

                <Form.Item label="Kinh độ" name="longitude">
                    <InputNumber
                        min={-180}
                        max={180}
                        step={0.00000001}
                        style={{ width: "100%" }}
                    />
                </Form.Item>

                <Form.Item label="Số điện thoại liên hệ" name="contactPhone">
                    <Input placeholder="Ví dụ: 0901234567" />
                </Form.Item>
            </Form>
        </Modal>
    );
}