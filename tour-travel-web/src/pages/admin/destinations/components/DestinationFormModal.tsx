// import { Form, Input, Modal } from "antd";
// import { useEffect } from "react";
// import {
//     CreateDestinationPayload,
//     IDestination,
// } from "../../../../types/destination";

// interface DestinationFormModalProps {
//     open: boolean;
//     loading?: boolean;
//     mode: "create" | "edit";
//     initialValues?: IDestination | null;
//     onCancel: () => void;
//     onSubmit: (values: CreateDestinationPayload) => Promise<void> | void;
// }

// interface DestinationFormValues {
//     name: string;
//     country?: string;
//     slug?: string;
//     description?: string;
// }

// export default function DestinationFormModal({
//     open,
//     loading = false,
//     mode,
//     initialValues,
//     onCancel,
//     onSubmit,
// }: DestinationFormModalProps) {
//     const [form] = Form.useForm<DestinationFormValues>();

//     useEffect(() => {
//         if (!open) {
//             form.resetFields();
//             return;
//         }

//         if (initialValues) {
//             form.setFieldsValue({
//                 name: initialValues.name,
//                 country: initialValues.country ?? "",
//                 slug: initialValues.slug,
//                 description: initialValues.description ?? "",
//             });
//         } else {
//             form.resetFields();
//         }
//     }, [open, initialValues, form]);

//     const handleOk = async () => {
//         const values = await form.validateFields();

//         const payload: CreateDestinationPayload = {
//             name: values.name.trim(),
//             ...(values.country?.trim() ? { country: values.country.trim() } : {}),
//             ...(values.slug?.trim() ? { slug: values.slug.trim() } : {}),
//             ...(values.description?.trim()
//                 ? { description: values.description.trim() }
//                 : {}),
//         };

//         await onSubmit(payload);
//     };

//     return (
//         <Modal
//             title={mode === "create" ? "Thêm điểm đến" : "Cập nhật điểm đến"}
//             open={open}
//             onCancel={onCancel}
//             onOk={handleOk}
//             okText={mode === "create" ? "Tạo mới" : "Cập nhật"}
//             cancelText="Hủy"
//             confirmLoading={loading}
//             destroyOnHidden
//         >
//             <Form form={form} layout="vertical">
//                 <Form.Item
//                     label="Tên điểm đến"
//                     name="name"
//                     rules={[
//                         { required: true, message: "Vui lòng nhập tên điểm đến" },
//                         { max: 150, message: "Tối đa 150 ký tự" },
//                     ]}
//                 >
//                     <Input placeholder="Ví dụ: Đà Nẵng" />
//                 </Form.Item>

//                 <Form.Item
//                     label="Quốc gia"
//                     name="country"
//                     rules={[{ max: 100, message: "Tối đa 100 ký tự" }]}
//                 >
//                     <Input placeholder="Ví dụ: Việt Nam" />
//                 </Form.Item>

//                 <Form.Item
//                     label="Slug"
//                     name="slug"
//                     rules={[{ max: 180, message: "Tối đa 180 ký tự" }]}
//                     extra="Để trống để backend tự generate từ tên"
//                 >
//                     <Input placeholder="Ví dụ: da-nang" />
//                 </Form.Item>

//                 <Form.Item label="Mô tả" name="description">
//                     <Input.TextArea rows={4} placeholder="Nhập mô tả" />
//                 </Form.Item>
//             </Form>
//         </Modal>
//     );
// }


import { Form, Input, InputNumber, Modal, Select, Switch } from "antd";
import { useEffect } from "react";
import {
    CreateDestinationPayload,
    DestinationRegion,
    DestinationType,
    destinationRegionOptions,
    destinationTypeOptions,
    IDestination,
} from "../../../../types/destination";

interface DestinationFormModalProps {
    open: boolean;
    loading?: boolean;
    mode: "create" | "edit";
    initialValues?: IDestination | null;
    onCancel: () => void;
    onSubmit: (values: CreateDestinationPayload) => Promise<void> | void;
}

interface DestinationFormValues {
    name: string;
    country?: string;
    slug?: string;
    description?: string;
    region?: DestinationRegion;
    destinationType?: DestinationType;
    isFeatured?: boolean;
    displayOrder?: number;

    mapAddress?: string;
    latitude?: number | null;
    longitude?: number | null;
}

export default function DestinationFormModal({
    open,
    loading = false,
    mode,
    initialValues,
    onCancel,
    onSubmit,
}: DestinationFormModalProps) {
    const [form] = Form.useForm<DestinationFormValues>();

    useEffect(() => {
        if (!open) {
            form.resetFields();
            return;
        }

        if (initialValues) {
            const formValues: DestinationFormValues = {
                name: initialValues.name,
                country: initialValues.country ?? "",
                slug: initialValues.slug ?? "",
                description: initialValues.description ?? "",
                isFeatured: initialValues.isFeatured ?? false,
                displayOrder: initialValues.displayOrder ?? 0,
                mapAddress: initialValues.mapAddress ?? "",
                latitude:
                    initialValues.latitude !== null && initialValues.latitude !== undefined
                        ? Number(initialValues.latitude)
                        : null,
                longitude:
                    initialValues.longitude !== null && initialValues.longitude !== undefined
                        ? Number(initialValues.longitude)
                        : null,
            };

            if (initialValues.region) {
                formValues.region = initialValues.region;
            }

            if (initialValues.destinationType) {
                formValues.destinationType = initialValues.destinationType;
            }

            form.setFieldsValue(formValues);;
        } else {
            form.setFieldsValue({
                country: "Việt Nam",
                isFeatured: false,
                displayOrder: 0,
                mapAddress: "",
                latitude: null,
                longitude: null,
            });
        }
    }, [open, initialValues, form]);

    const handleOk = async () => {
        const values = await form.validateFields();

        const payload: CreateDestinationPayload = {
            name: values.name.trim(),
            ...(values.country?.trim()
                ? { country: values.country.trim() }
                : {}),
            ...(values.slug?.trim() ? { slug: values.slug.trim() } : {}),
            ...(values.description?.trim()
                ? { description: values.description.trim() }
                : {}),
            ...(values.region ? { region: values.region } : {}),
            ...(values.destinationType
                ? { destinationType: values.destinationType }
                : {}),
            isFeatured: values.isFeatured ?? false,
            displayOrder: values.displayOrder ?? 0,

            mapAddress: values.mapAddress?.trim() || null,
            latitude:
                values.latitude !== undefined && values.latitude !== null
                    ? values.latitude
                    : null,
            longitude:
                values.longitude !== undefined && values.longitude !== null
                    ? values.longitude
                    : null,
        };

        await onSubmit(payload);
    };

    return (
        <Modal
            title={mode === "create" ? "Thêm điểm đến" : "Cập nhật điểm đến"}
            open={open}
            onCancel={onCancel}
            onOk={handleOk}
            okText={mode === "create" ? "Tạo mới" : "Cập nhật"}
            cancelText="Hủy"
            confirmLoading={loading}
            destroyOnHidden
            width={720}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    label="Tên điểm đến"
                    name="name"
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng nhập tên điểm đến",
                        },
                        { max: 150, message: "Tối đa 150 ký tự" },
                    ]}
                >
                    <Input placeholder="Ví dụ: Đà Nẵng, Hạ Long, Bangkok, Tokyo" />
                </Form.Item>

                <Form.Item
                    label="Quốc gia"
                    name="country"
                    rules={[{ max: 100, message: "Tối đa 100 ký tự" }]}
                >
                    <Input placeholder="Ví dụ: Việt Nam, Thái Lan, Nhật Bản" />
                </Form.Item>

                <Form.Item
                    label="Slug"
                    name="slug"
                    rules={[{ max: 180, message: "Tối đa 180 ký tự" }]}
                    extra="Để trống để backend tự tạo từ tên điểm đến"
                >
                    <Input placeholder="Ví dụ: da-nang, ha-long, bangkok" />
                </Form.Item>

                <Form.Item
                    label="Khu vực"
                    name="region"
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng chọn khu vực",
                        },
                    ]}
                >
                    <Select
                        placeholder="Chọn khu vực"
                        options={destinationRegionOptions}
                        allowClear
                    />
                </Form.Item>

                <Form.Item
                    label="Loại điểm đến"
                    name="destinationType"
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng chọn loại điểm đến",
                        },
                    ]}
                >
                    <Select
                        placeholder="Chọn loại điểm đến"
                        options={destinationTypeOptions}
                        allowClear
                    />
                </Form.Item>

                <Form.Item
                    label="Địa chỉ hiển thị trên bản đồ"
                    name="mapAddress"
                    rules={[{ max: 255, message: "Tối đa 255 ký tự" }]}
                    extra="Ví dụ: Đà Nẵng, Việt Nam"
                >
                    <Input placeholder="Ví dụ: Đà Nẵng, Việt Nam" />
                </Form.Item>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 16,
                    }}
                >
                    <Form.Item
                        label="Latitude"
                        name="latitude"
                        rules={[
                            {
                                type: "number",
                                min: -90,
                                max: 90,
                                message: "Latitude phải nằm trong khoảng -90 đến 90",
                            },
                        ]}
                        extra="Ví dụ: 16.047079"
                    >
                        <InputNumber
                            style={{ width: "100%" }}
                            placeholder="16.047079"
                            min={-90}
                            max={90}
                            step={0.000001}
                            precision={7}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Longitude"
                        name="longitude"
                        rules={[
                            {
                                type: "number",
                                min: -180,
                                max: 180,
                                message: "Longitude phải nằm trong khoảng -180 đến 180",
                            },
                        ]}
                        extra="Ví dụ: 108.206230"
                    >
                        <InputNumber
                            style={{ width: "100%" }}
                            placeholder="108.206230"
                            min={-180}
                            max={180}
                            step={0.000001}
                            precision={7}
                        />
                    </Form.Item>
                </div>

                <Form.Item label="Hiển thị ở trang chủ" name="isFeatured" valuePropName="checked">
                    <Switch checkedChildren="Có" unCheckedChildren="Không" />
                </Form.Item>

                <Form.Item
                    label="Thứ tự hiển thị"
                    name="displayOrder"
                    extra="Số nhỏ sẽ hiển thị trước trên trang chủ"
                >
                    <InputNumber
                        min={0}
                        style={{ width: "100%" }}
                        placeholder="Ví dụ: 1"
                    />
                </Form.Item>

                <Form.Item label="Mô tả" name="description">
                    <Input.TextArea
                        rows={4}
                        placeholder="Nhập mô tả ngắn về điểm đến"
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}