import { Form, Input, Modal, Switch } from "antd";
import { useEffect } from "react";
import { CreateRolePayload, IRole } from "../../../../types/role";

interface RoleFormModalProps {
    open: boolean;
    loading?: boolean;
    mode: "create" | "edit";
    initialValues?: IRole | null;
    onCancel: () => void;
    onSubmit: (values: CreateRolePayload) => Promise<void> | void;
}

interface RoleFormValues {
    code: string;
    name: string;
    description?: string;
    isSystem?: boolean;
}

export default function RoleFormModal({
    open,
    loading = false,
    mode,
    initialValues,
    onCancel,
    onSubmit,
}: RoleFormModalProps) {
    const [form] = Form.useForm<RoleFormValues>();

    useEffect(() => {
        if (!open) {
            form.resetFields();
            return;
        }

        if (initialValues) {
            form.setFieldsValue({
                code: initialValues.code,
                name: initialValues.name,
                description: initialValues.description ?? "",
                isSystem: initialValues.isSystem,
            });
        } else {
            form.resetFields();
            form.setFieldsValue({ isSystem: false });
        }
    }, [open, initialValues, form]);

    const handleOk = async () => {
        const values = await form.validateFields();

        const payload: CreateRolePayload = {
            code: values.code.trim().toLowerCase(),
            name: values.name.trim(),
            isSystem: !!values.isSystem,
            ...(values.description?.trim()
                ? { description: values.description.trim() }
                : {}),
        };

        await onSubmit(payload);
    };

    return (
        <Modal
            title={mode === "create" ? "Thêm role" : "Cập nhật role"}
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
                    label="Mã role"
                    name="code"
                    rules={[
                        { required: true, message: "Vui lòng nhập mã role" },
                        { max: 100, message: "Tối đa 100 ký tự" },
                    ]}
                >
                    <Input placeholder="Ví dụ: admin" />
                </Form.Item>

                <Form.Item
                    label="Tên role"
                    name="name"
                    rules={[
                        { required: true, message: "Vui lòng nhập tên role" },
                        { max: 255, message: "Tối đa 255 ký tự" },
                    ]}
                >
                    <Input placeholder="Ví dụ: Quản trị hệ thống" />
                </Form.Item>

                <Form.Item
                    label="Mô tả"
                    name="description"
                    rules={[{ max: 500, message: "Tối đa 500 ký tự" }]}
                >
                    <Input.TextArea rows={4} placeholder="Nhập mô tả role" />
                </Form.Item>

                <Form.Item
                    label="Role hệ thống"
                    name="isSystem"
                    valuePropName="checked"
                >
                    <Switch />
                </Form.Item>
            </Form>
        </Modal>
    );
}