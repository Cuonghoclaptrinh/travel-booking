import { ReactNode } from "react";
import { Space, Typography } from "antd";

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    extra?: ReactNode;
}

export default function PageHeader({
    title,
    subtitle,
    extra,
}: PageHeaderProps) {
    return (
        <div
            style={{
                marginBottom: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
                flexWrap: "wrap",
            }}
        >
            <Space direction="vertical" size={2}>
                <Typography.Title level={3} style={{ margin: 0 }}>
                    {title}
                </Typography.Title>

                {subtitle ? (
                    <Typography.Text type="secondary">{subtitle}</Typography.Text>
                ) : null}
            </Space>

            {extra ? <div>{extra}</div> : null}
        </div>
    );
}