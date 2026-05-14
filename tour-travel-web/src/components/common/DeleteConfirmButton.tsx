import { ReactNode } from "react";
import { Button, Popconfirm } from "antd";

interface DeleteConfirmButtonProps {
    title?: string;
    description?: string;
    onConfirm: () => void | Promise<void>;
    loading?: boolean;
    disabled?: boolean;
    children?: ReactNode;
}

export default function DeleteConfirmButton({
    title = "Xác nhận xóa",
    description = "Bạn có chắc muốn xóa bản ghi này không?",
    onConfirm,
    loading = false,
    disabled = false,
    children,
}: DeleteConfirmButtonProps) {
    return (
        <Popconfirm
            title={title}
            description={description}
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={onConfirm}
            disabled={disabled}
        >
            <Button danger loading={loading} disabled={disabled}>
                {children ?? "Xóa"}
            </Button>
        </Popconfirm>
    );
}