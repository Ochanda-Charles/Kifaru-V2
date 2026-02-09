"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import api from "@/app/utilis/api";
import {
    Layout,
    Button,
    Table,
    Modal,
    Form,
    Input,
    Select,
    message,
    Typography,
    Space,
    Popconfirm,
    Tag,
    Card
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    TeamOutlined,
    StopOutlined,
    CheckCircleOutlined
} from "@ant-design/icons";

const { Title } = Typography;
const { Option } = Select;

// Types
interface Supplier {
    id: number;
    name: string;
    contact_email: string;
    phone?: string;
    address?: string;
    status: "Active" | "Inactive";
}

const SuppliersPage: React.FC = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [form] = Form.useForm();
    const [merchant_id, setMerchantId] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<"All" | "Active" | "Inactive">("All");

    useEffect(() => {
        const token = localStorage.getItem("merchantToken");
        if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }
        const mId = localStorage.getItem("merchant_id");
        setMerchantId(mId);

        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const response = await api.get("/inventory/suppliers");
            // Backend returns is_active (boolean), frontend needs status (Active/Inactive)
            const mappedSuppliers = response.data.data.map((s: any) => ({
                ...s,
                status: s.is_active ? "Active" : "Inactive"
            }));
            setSuppliers(mappedSuppliers);
        } catch (error) {
            console.error("Error fetching suppliers:", error);
            message.error("Failed to load suppliers.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddStart = () => {
        setEditingSupplier(null);
        form.resetFields();
        // Default status to Active
        form.setFieldsValue({ status: "Active" });
        setModalVisible(true);
    };

    const handleEditStart = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        form.setFieldsValue({
            name: supplier.name,
            contact_email: supplier.contact_email,
            phone: supplier.phone,
            address: supplier.address,
            status: supplier.status,
        });
        setModalVisible(true);
    };

    const handleDeactivate = async (id: number, currentStatus: string) => {
        // Toggle status or deactivate? Request says "Edit/Deactivate".
        // Assuming Deactivate means setting status to Inactive.
        // Or if checking DELETE functionality too. Prompt says DELETE /suppliers/:id
        // I'll implement Delete for permanent removal and status toggle via Edit or separate action if needed.
        // But let's follow the prompt: DELETE /suppliers/:id (or deactivate)
        // I will implement Delete button.
        try {
            await api.delete(`/inventory/suppliers/${id}`);
            message.success("Supplier deleted successfully.");
            fetchSuppliers();
        } catch (error) {
            console.error("Delete error:", error);
            message.error("Failed to delete supplier.");
        }
    };

    const handleToggleStatus = async (supplier: Supplier) => {
        const newStatus = supplier.status === "Active" ? "Inactive" : "Active";
        try {
            await api.put(`/inventory/suppliers/${supplier.id}`, { ...supplier, status: newStatus, merchant_id });
            message.success(`Supplier marked as ${newStatus}`);
            fetchSuppliers();
        } catch (error) {
            console.error("Status update error:", error);
            message.error("Failed to update status.");
        }
    }


    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            const is_active = values.status === 'Active';
            // Exclude status from payload, send is_active
            const { status, ...rest } = values;
            const payload = { ...rest, is_active, merchant_id };

            try {
                if (editingSupplier) {
                    await api.put(`/inventory/suppliers/${editingSupplier.id}`, payload);
                    message.success("Supplier updated successfully.");
                } else {
                    await api.post("/inventory/suppliers", payload);
                    message.success("Supplier created successfully.");
                }
                setModalVisible(false);
                fetchSuppliers();
            } catch (error) {
                console.error("Save error:", error);
                message.error("Failed to save supplier.");
            }
        } catch (error) {
            console.error("Validation error:", error);
            message.error("Please fill in all required fields.");
        }
    };

    const filteredSuppliers = suppliers.filter(s => {
        if (filterStatus === "All") return true;
        return s.status === filterStatus;
    });

    const columns = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Email",
            dataIndex: "contact_email",
            key: "contact_email",
        },
        {
            title: "Phone",
            dataIndex: "phone",
            key: "phone",
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status: string) => (
                <Tag color={status === "Active" ? "green" : "red"}>
                    {status}
                </Tag>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            render: (_: any, record: Supplier) => (
                <Space>
                    <Button
                        size="small"
                        title={record.status === "Active" ? "Deactivate" : "Activate"}
                        icon={record.status === "Active" ? <StopOutlined /> : <CheckCircleOutlined />}
                        onClick={() => handleToggleStatus(record)}
                        danger={record.status === "Active"}
                        style={record.status !== "Active" ? { color: 'green', borderColor: 'green' } : {}}
                    />

                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => handleEditStart(record)}
                    />
                    <Popconfirm
                        title="Are you sure you want to delete this supplier?"
                        onConfirm={() => handleDeactivate(record.id, record.status)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>
                    <TeamOutlined /> Suppliers
                </Title>
                <div style={{ display: 'flex', gap: 16 }}>
                    <Select
                        defaultValue="All"
                        style={{ width: 120 }}
                        onChange={(value: any) => setFilterStatus(value)}
                    >
                        <Option value="All">All Status</Option>
                        <Option value="Active">Active</Option>
                        <Option value="Inactive">Inactive</Option>
                    </Select>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddStart}
                        size="large"
                        style={{ backgroundColor: "#047857", borderColor: "#047857" }}
                    >
                        Add Supplier
                    </Button>
                </div>

            </div>

            <Card>
                <Table
                    columns={columns}
                    dataSource={filteredSuppliers}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Modal
                title={editingSupplier ? "Edit Supplier" : "Add Supplier"}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={() => setModalVisible(false)}
                okText="Save"
                cancelText="Cancel"
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="name"
                        label="Name"
                        rules={[{ required: true, message: "Please enter supplier name" }]}
                    >
                        <Input placeholder="Supplier Name" />
                    </Form.Item>

                    <Form.Item
                        name="contact_email"
                        label="Contact Email"
                        rules={[
                            { type: 'email', message: 'The input is not valid E-mail!' },
                            { required: true, message: 'Please input your E-mail!' }
                        ]}
                    >
                        <Input placeholder="email@example.com" />
                    </Form.Item>

                    <Form.Item name="phone" label="Phone">
                        <Input placeholder="Phone Number" />
                    </Form.Item>

                    <Form.Item name="address" label="Address">
                        <Input.TextArea rows={2} placeholder="Address" />
                    </Form.Item>

                    <Form.Item name="status" label="Status">
                        <Select>
                            <Option value="Active">Active</Option>
                            <Option value="Inactive">Inactive</Option>
                        </Select>
                    </Form.Item>

                </Form>
            </Modal>
        </div>
    );
};

export default SuppliersPage;
