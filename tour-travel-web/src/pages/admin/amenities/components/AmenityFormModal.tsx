import { Form, Input, Modal } from "antd";
import { useEffect } from "react";
import { CreateAmenityPayload, IAmenity } from "../../../../types/amenity";

interface AmenityFormModalProps {
    open: boolean;
    loading?: boolean;
    mode: "create" | "edit";
    initialValues?: IAmenity | null;
    onCancel: () => void;
    onSubmit: (values: CreateAmenityPayload) => Promise<void> | void;
}

interface AmenityFormValues {
    name: string;
}

export default function AmenityFormModal({
    open,
    loading = false,
    mode,
    initialValues,
    onCancel,
    onSubmit,
}: AmenityFormModalProps) {
    const [form] = Form.useForm<AmenityFormValues>();

    useEffect(() => {
        if (!open) {
            form.resetFields();
            return;
        }

        if (initialValues) {
            form.setFieldsValue({
                name: initialValues.name,
            });
        } else {
            form.resetFields();
        }
    }, [open, initialValues, form]);

    const handleOk = async () => {
        const values = await form.validateFields();

        const payload: CreateAmenityPayload = {
            name: values.name.trim(),
        };

        await onSubmit(payload);
    };

    return (
        <Modal
            title={mode === "create" ? "Thêm tiện ích" : "Cập nhật tiện ích"}
            open={open}
            onCancel={onCancel}
            onOk={handleOk}
            okText={mode === "create" ? "Tạo mới" : "Cập nhật"}
            cancelText="Hủy"
            confirmLoading={loading}
            destroyOnHidden
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    label="Tên tiện ích"
                    name="name"
                    rules={[
                        { required: true, message: "Vui lòng nhập tên tiện ích" },
                        { max: 100, message: "Tối đa 100 ký tự" },
                    ]}
                >
                    <Input placeholder="Ví dụ: Hồ bơi" />
                </Form.Item>
            </Form>
        </Modal>
    );
}