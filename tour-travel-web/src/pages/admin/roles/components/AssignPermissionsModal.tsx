import { useEffect, useMemo, useState } from "react";
import {
    Input,
    Modal,
    Space,
    Table,
    Tag,
    Typography,
    message,
} from "antd";
import type { ColumnsType } from "antd/es/table";

import permissionsService from "../../../../services/admin/permissionsService";
import rolesService from "../../../../services/admin/rolesService";
import { IPermission } from "../../../../types/permission";
import { IRole } from "../../../../types/role";

interface AssignPermissionsModalProps {
    open: boolean;
    role: IRole | null;
    onCancel: () => void;
    onSuccess: () => void;
}

export default function AssignPermissionsModal({
    open,
    role,
    onCancel,
    onSuccess,
}: AssignPermissionsModalProps) {
    const [messageApi, contextHolder] = message.useMessage();

    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [keyword, setKeyword] = useState<string>("");

    const [allPermissions, setAllPermissions] = useState<IPermission[]>([]);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    const fetchData = async () => {
        if (!open || !role) return;

        setLoading(true);
        try {
            const [allResponse, assignedResponse] = await Promise.all([
                permissionsService.getPaging({
                    page: 1,
                    limit: 1000,
                    keyword: "",
                }),
                rolesService.getPermissions(role.id),
            ]);

            setAllPermissions(allResponse.data);
            setSelectedRowKeys(
                assignedResponse.permissions.map((item) => item.id)
            );
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message ||
                "Không thể tải danh sách permission";
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
    }, [open, role]);

    const filteredPermissions = useMemo(() => {
        const normalizedKeyword = keyword.trim().toLowerCase();

        if (!normalizedKeyword) return allPermissions;

        return allPermissions.filter((item) =>
            [item.code, item.name, item.module, item.description ?? ""]
                .join(" ")
                .toLowerCase()
                .includes(normalizedKeyword)
        );
    }, [allPermissions, keyword]);

    const columns: ColumnsType<IPermission> = [
        {
            title: "Code",
            dataIndex: "code",
            key: "code",
            width: 220,
            render: (value: string) => <Typography.Text code>{value}</Typography.Text>,
        },
        {
            title: "Tên",
            dataIndex: "name",
            key: "name",
            width: 240,
        },
        {
            title: "Module",
            dataIndex: "module",
            key: "module",
            width: 160,
            render: (value: string) => <Tag color="blue">{value}</Tag>,
        },
        {
            title: "Mô tả",
            dataIndex: "description",
            key: "description",
            render: (value?: string) => value || "-",
        },
    ];

    const handleSave = async () => {
        if (!role) return;

        setSaving(true);
        try {
            const permissionIds = selectedRowKeys
                .map((item) => Number(item))
                .filter((item) => Number.isFinite(item));

            await rolesService.assignPermissions(role.id, {
                permissionIds,
            });

            messageApi.success("Cập nhật permission cho role thành công");
            onSuccess();
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message ||
                "Cập nhật permission cho role thất bại";
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
                title={
                    role
                        ? `Gán permission cho role: ${role.name}`
                        : "Gán permission cho role"
                }
                open={open}
                onCancel={onCancel}
                onOk={handleSave}
                okText="Lưu"
                cancelText="Hủy"
                confirmLoading={saving}
                width={1000}
                destroyOnHidden
            >
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                    <Input.Search
                        allowClear
                        placeholder="Tìm permission theo code, tên, module..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />

                    <Table<IPermission>
                        rowKey="id"
                        loading={loading}
                        columns={columns}
                        dataSource={filteredPermissions}
                        pagination={{ pageSize: 8 }}
                        scroll={{ x: 900 }}
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