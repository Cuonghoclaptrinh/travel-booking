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

import rolesService from "../../../../services/admin/rolesService";
import usersService from "../../../../services/admin/usersService";
import { IRole } from "../../../../types/role";
import { IUser } from "../../../../types/user";

interface AssignRolesModalProps {
    open: boolean;
    user: IUser | null;
    onCancel: () => void;
    onSuccess: () => void;
}

export default function AssignRolesModal({
    open,
    user,
    onCancel,
    onSuccess,
}: AssignRolesModalProps) {
    const [messageApi, contextHolder] = message.useMessage();

    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [keyword, setKeyword] = useState<string>("");

    const [allRoles, setAllRoles] = useState<IRole[]>([]);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    const fetchData = async () => {
        if (!open || !user) return;

        setLoading(true);
        try {
            const [allResponse, assignedResponse] = await Promise.all([
                rolesService.getPaging({
                    page: 1,
                    limit: 1000,
                    keyword: "",
                }),
                usersService.getRoles(user.id),
            ]);

            setAllRoles(allResponse.data);
            setSelectedRowKeys(assignedResponse.roles.map((item) => item.id));
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message || "Không thể tải danh sách role";
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
    }, [open, user]);

    const filteredRoles = useMemo(() => {
        const normalizedKeyword = keyword.trim().toLowerCase();

        if (!normalizedKeyword) return allRoles;

        return allRoles.filter((item) =>
            [item.code, item.name, item.description ?? ""]
                .join(" ")
                .toLowerCase()
                .includes(normalizedKeyword)
        );
    }, [allRoles, keyword]);

    const columns: ColumnsType<IRole> = [
        {
            title: "Code",
            dataIndex: "code",
            key: "code",
            width: 180,
            render: (value: string) => <Typography.Text code>{value}</Typography.Text>,
        },
        {
            title: "Tên",
            dataIndex: "name",
            key: "name",
            width: 220,
        },
        {
            title: "Mô tả",
            dataIndex: "description",
            key: "description",
            render: (value?: string) => value || "-",
        },
        {
            title: "Loại",
            dataIndex: "isSystem",
            key: "isSystem",
            width: 120,
            render: (value: boolean) =>
                value ? <Tag color="gold">System</Tag> : <Tag>Normal</Tag>,
        },
    ];

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        try {
            const roleIds = selectedRowKeys
                .map((item) => Number(item))
                .filter((item) => Number.isFinite(item));

            await usersService.assignRoles(user.id, {
                roleIds,
            });

            messageApi.success("Cập nhật role cho user thành công");
            onSuccess();
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message ||
                "Cập nhật role cho user thất bại";
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
                    user ? `Gán role cho user: ${user.name}` : "Gán role cho user"
                }
                open={open}
                onCancel={onCancel}
                onOk={handleSave}
                okText="Lưu"
                cancelText="Hủy"
                confirmLoading={saving}
                width={950}
                destroyOnHidden
            >
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                    <Input.Search
                        allowClear
                        placeholder="Tìm role theo code, tên, mô tả..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />

                    <Table<IRole>
                        rowKey="id"
                        loading={loading}
                        columns={columns}
                        dataSource={filteredRoles}
                        pagination={{ pageSize: 8 }}
                        scroll={{ x: 850 }}
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