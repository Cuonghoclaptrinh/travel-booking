import { Form, Input, Modal } from "antd";
import { useEffect } from "react";
import {
    CreatePermissionPayload,
    IPermission,
} from "../../../../types/permission";

interface PermissionFormModalProps {
    open: boolean;
    loading?: boolean;
    mode: "create" | "edit";
    initialValues?: IPermission | null;
    onCancel: () => void;
    onSubmit: (values: CreatePermissionPayload) => Promise<void> | void;
}

interface PermissionFormValues {
    code: string;
    name: string;
    module: string;
    description?: string;
}

export default function PermissionFormModal({
    open,
    loading = false,
    mode,
    initialValues,
    onCancel,
    onSubmit,
}: PermissionFormModalProps) {
    const [form] = Form.useForm<PermissionFormValues>();

    useEffect(() => {
        if (!open) {
            form.resetFields();
            return;
        }

        if (initialValues) {
            form.setFieldsValue({
                code: initialValues.code,
                name: initialValues.name,
                module: initialValues.module,
                description: initialValues.description ?? "",
            });
        } else {
            form.resetFields();
        }
    }, [open, initialValues, form]);

    const handleOk = async () => {
        const values = await form.validateFields();

        const payload: CreatePermissionPayload = {
            code: values.code.trim(),
            name: values.name.trim(),
            module: values.module.trim(),
            ...(values.description?.trim()
                ? { description: values.description.trim() }
                : {}),
        };

        await onSubmit(payload);
    };

    return (
        <Modal
            title={mode === "create" ? "Thêm permission" : "Cập nhật permission"}
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
                    label="Mã permission"
                    name="code"
                    rules={[
                        { required: true, message: "Vui lòng nhập mã permission" },
                        { max: 150, message: "Tối đa 150 ký tự" },
                    ]}
                >
                    <Input placeholder="Ví dụ: permission.view" />
                </Form.Item>

                <Form.Item
                    label="Tên permission"
                    name="name"
                    rules={[
                        { required: true, message: "Vui lòng nhập tên permission" },
                        { max: 255, message: "Tối đa 255 ký tự" },
                    ]}
                >
                    <Input placeholder="Ví dụ: Xem permission" />
                </Form.Item>

                <Form.Item
                    label="Module"
                    name="module"
                    rules={[
                        { required: true, message: "Vui lòng nhập module" },
                        { max: 100, message: "Tối đa 100 ký tự" },
                    ]}
                >
                    <Input placeholder="Ví dụ: permission" />
                </Form.Item>

                <Form.Item
                    label="Mô tả"
                    name="description"
                    rules={[{ max: 500, message: "Tối đa 500 ký tự" }]}
                >
                    <Input.TextArea
                        rows={4}
                        placeholder="Nhập mô tả permission"
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}