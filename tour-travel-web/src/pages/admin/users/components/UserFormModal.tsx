import { Form, Input, Modal } from "antd";
import { useEffect } from "react";
import { CreateUserPayload, IUser } from "../../../../types/user";

interface UserFormModalProps {
    open: boolean;
    loading?: boolean;
    mode: "create" | "edit";
    initialValues?: IUser | null;
    onCancel: () => void;
    onSubmit: (values: CreateUserPayload) => Promise<void> | void;
}

interface UserFormValues {
    name: string;
    email: string;
    phone?: string;
    password?: string;
}

export default function UserFormModal({
    open,
    loading = false,
    mode,
    initialValues,
    onCancel,
    onSubmit,
}: UserFormModalProps) {
    const [form] = Form.useForm<UserFormValues>();

    useEffect(() => {
        if (!open) {
            form.resetFields();
            return;
        }

        if (initialValues) {
            form.setFieldsValue({
                name: initialValues.name,
                email: initialValues.email,
                phone: initialValues.phone ?? "",
                password: "",
            });
        } else {
            form.resetFields();
        }
    }, [open, initialValues, form]);

    const handleOk = async () => {
        const values = await form.validateFields();

        const payload: CreateUserPayload = {
            name: values.name.trim(),
            email: values.email.trim(),
            password: values.password?.trim() ?? "",
            ...(values.phone?.trim() ? { phone: values.phone.trim() } : {}),
        };

        if (mode === "edit" && !values.password?.trim()) {
            const { password, ...rest } = payload;
            await onSubmit(rest as CreateUserPayload);
            return;
        }

        await onSubmit(payload);
    };

    return (
        <Modal
            title={mode === "create" ? "Thêm user" : "Cập nhật user"}
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
                    label="Họ tên"
                    name="name"
                    rules={[
                        { required: true, message: "Vui lòng nhập họ tên" },
                        { max: 255, message: "Tối đa 255 ký tự" },
                    ]}
                >
                    <Input placeholder="Nhập họ tên" />
                </Form.Item>

                <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                        { required: true, message: "Vui lòng nhập email" },
                        { type: "email", message: "Email không hợp lệ" },
                        { max: 255, message: "Tối đa 255 ký tự" },
                    ]}
                >
                    <Input placeholder="Nhập email" />
                </Form.Item>

                <Form.Item
                    label="Số điện thoại"
                    name="phone"
                    rules={[{ max: 20, message: "Tối đa 20 ký tự" }]}
                >
                    <Input placeholder="Nhập số điện thoại" />
                </Form.Item>

                <Form.Item
                    label={mode === "create" ? "Mật khẩu" : "Mật khẩu mới"}
                    name="password"
                    rules={[
                        ...(mode === "create"
                            ? [{ required: true, message: "Vui lòng nhập mật khẩu" }]
                            : []),
                        { min: 6, message: "Ít nhất 6 ký tự" },
                        { max: 50, message: "Tối đa 50 ký tự" },
                    ]}
                    extra={
                        mode === "edit"
                            ? "Để trống nếu không muốn đổi mật khẩu"
                            : undefined
                    }
                >
                    <Input.Password placeholder="Nhập mật khẩu" />
                </Form.Item>
            </Form>
        </Modal>
    );
}