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
    Card
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    FolderOpenOutlined,
} from "@ant-design/icons";

const { Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

// Types
interface Category {
    id: number;
    name: string;
    description: string;
    parent_id?: number | null;
    parent_name?: string | null;
    product_count?: number;
    children?: Category[];
}

const CategoriesPage: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [form] = Form.useForm();
    const [merchant_id, setMerchantId] = useState<string | null>(null);

    useEffect(() => {
        // Initial setup similar to dashboard
        const token = localStorage.getItem("merchantToken");
        if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }
        const mId = localStorage.getItem("merchant_id");
        setMerchantId(mId);

        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await api.get("/inventory/categories");
            setCategories(response.data.data);
        } catch (error) {
            console.error("Error fetching categories:", error);
            message.error("Failed to load categories.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddStart = () => {
        setEditingCategory(null);
        form.resetFields();
        setModalVisible(true);
    };

    const handleEditStart = (category: Category) => {
        setEditingCategory(category);
        form.setFieldsValue({
            name: category.name,
            description: category.description,
            parent_id: category.parent_id,
        });
        setModalVisible(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/inventory/categories/${id}`);
            message.success("Category deleted successfully.");
            fetchCategories();
        } catch (error: any) {
            console.error("Delete error:", error);
            // Check if error is due to products existing
            if (error.response?.status === 400 || error.response?.data?.message?.includes("product")) {
                message.error("Cannot delete category with products. Please move products first.");
            } else {
                message.error("Failed to delete category.");
            }
        }
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            const payload = { ...values, merchant_id };

            if (editingCategory) {
                await api.put(`/inventory/categories/${editingCategory.id}`, payload);
                message.success("Category updated successfully.");
            } else {
                await api.post("/inventory/categories", payload);
                message.success("Category added successfully.");
            }
            setModalVisible(false);
            fetchCategories();
        } catch (error) {
            console.error("Save error:", error);
            message.error("Failed to save category.");
        }
    };

    const columns = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
        },
        {
            title: "Parent Category",
            dataIndex: "parent_name", // Assuming backend joins this, if not we might need to look it up
            key: "parent_name",
            render: (text: string, record: Category) => {
                if (record.parent_id) {
                    const parent = categories.find(c => c.id === record.parent_id);
                    return parent ? parent.name : record.parent_id; // Fallback
                }
                return "-";
            }
        },
        {
            title: "Products",
            dataIndex: "product_count",
            key: "product_count",
            render: (count: number) => count || 0,
        },
        {
            title: "Actions",
            key: "actions",
            render: (_: any, record: Category) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => handleEditStart(record)}
                    />
                    <Popconfirm
                        title="Are you sure you want to delete this category?"
                        onConfirm={() => handleDelete(record.id)}
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
                    <FolderOpenOutlined /> Categories
                </Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddStart}
                    size="large"
                    style={{ backgroundColor: "#047857", borderColor: "#047857" }}
                >
                    Add Category
                </Button>
            </div>

            <Card>
                <Table
                    columns={columns}
                    dataSource={categories}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Modal
                title={editingCategory ? "Edit Category" : "Add Category"}
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
                        rules={[{ required: true, message: "Please enter category name" }]}
                    >
                        <Input placeholder="e.g., Electronics" />
                    </Form.Item>

                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={3} placeholder="Category description..." />
                    </Form.Item>

                    <Form.Item name="parent_id" label="Parent Category">
                        <Select
                            placeholder="Select parent category (optional)"
                            allowClear
                        >
                            {categories
                                .filter(c => c.id !== editingCategory?.id) // Prevent selecting self as parent
                                .map(c => (
                                    <Option key={c.id} value={c.id}>
                                        {c.name}
                                    </Option>
                                ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default CategoriesPage;
