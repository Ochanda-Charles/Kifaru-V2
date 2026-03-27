"use client";

import React, { useEffect, useState } from "react";
import api from "@/app/utilis/api";
import { jwtDecode } from "jwt-decode";
import {
    Button,
    Card,
    Row,
    Col,
    Typography,
    Form,
    Select,
    InputNumber,
    Input,
    message,
    Spin,
    Divider,
    Checkbox,
} from "antd";
import {
    ArrowLeftOutlined,
    SaveOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import CloudinaryUpload from "@/app/components/CloudinaryUpload";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

type Category = {
    id: string;
    name: string;
};

type Supplier = {
    id: string;
    name: string;
};

const AddProductPage: React.FC = () => {
    const router = useRouter();
    const [merchantId, setMerchantId] = useState<string | null>(null);
    const [form] = Form.useForm();

    // Data states
    const [categories, setCategories] = useState<Category[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    // Initialize auth
    useEffect(() => {
        const token = localStorage.getItem("merchantToken");
        if (!token) return;

        try {
            const decoded: any = jwtDecode(token);
            const id = decoded.merchant_id || decoded.sub || null;

            if (id) {
                setMerchantId(id);
                fetchHelpers();
            }
        } catch (error) {
            console.error("Token decode error:", error);
        }
    }, []);

    const fetchHelpers = async () => {
        setLoadingData(true);
        try {
            const [catsRes, suppsRes] = await Promise.all([
                api.get('/inventory/categories'),
                api.get('/inventory/suppliers')
            ]);

            setCategories(catsRes.data.data || []);
            setSuppliers(suppsRes.data.data || []);
        } catch (error) {
            console.error("Error fetching helper data:", error);
            message.warning("Could not load categories or suppliers. You may need to create them first.");
        } finally {
            setLoadingData(false);
        }
    };

    const onFinish = async (values: any) => {
        if (!merchantId) {
            message.error("Merchant ID not found. Please relogin.");
            return;
        }

        if (!imageUrl) {
            message.error("Please upload a product image.");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                name: values.name,
                description: values.description,
                price: values.price,
                quantity: values.quantity,
                category_id: values.categoryId,
                supplier_id: values.supplierId,
                image_url: imageUrl,
                sku: values.sku,
                low_stock_threshold: values.lowStockThreshold ?? 10,
                bestseller: values.bestseller ?? false,
                new: values.new ?? true,
            };

            await api.post("/inventory/products", payload);

            message.success("Product added successfully!");
            router.push("/merchants/dashboard/inventory");
        } catch (error) {
            console.error("Create product error:", error);
            message.error("Failed to create product. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <Button
                type="link"
                icon={<ArrowLeftOutlined />}
                onClick={() => router.back()}
                style={{ marginBottom: 16, color: "#1f2937", fontWeight: "bold", padding: 0 }}
            >
                Back to Inventory
            </Button>

            <Card
                className="shadow-lg"
                style={{ borderRadius: 12, background: "rgba(255,255,255,0.95)" }}
            >
                {loadingData ? (
                    <div className="flex justify-center p-8">
                        <Spin size="large" tip="Loading form data..." />
                    </div>
                ) : (
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        initialValues={{
                            customReason: "Initial Stock",
                            new: true,
                        }}
                    >
                        <Row gutter={24}>
                            <Col xs={24} md={16}>
                                <Card type="inner" title="Basic Information" className="mb-6">
                                    <Form.Item
                                        name="name"
                                        label="Product Name"
                                        rules={[{ required: true, message: "Please enter product name" }]}
                                    >
                                        <Input placeholder="e.g., Wireless Headphones" size="large" />
                                    </Form.Item>

                                    <Form.Item
                                        name="description"
                                        label="Description"
                                    >
                                        <TextArea rows={4} placeholder="Product features, key details..." />
                                    </Form.Item>

                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item
                                                name="categoryId"
                                                label="Category"
                                                rules={[{ required: true, message: "Please select a category" }]}
                                            >
                                                <Select placeholder="Select Category" size="large">
                                                    {categories.map(c => (
                                                        <Option key={c.id} value={c.id}>{c.name}</Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item name="sku" label="SKU (Stock Keeping Unit)">
                                                <Input placeholder="e.g., WH-001" size="large" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Card>

                                <Card type="inner" title="Pricing & Inventory">
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item
                                                name="price"
                                                label="Price (KSH)"
                                                rules={[{ required: true, message: "Please enter price" }]}
                                            >
                                                <InputNumber
                                                    style={{ width: "100%" }}
                                                    size="large"
                                                    min={0}
                                                    prefix="KSH"
                                                    precision={2}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                name="quantity"
                                                label="Initial Quantity"
                                                rules={[{ required: true, message: "Please enter quantity" }]}
                                            >
                                                <InputNumber
                                                    style={{ width: "100%" }}
                                                    size="large"
                                                    min={0}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item name="lowStockThreshold" label="Low Stock Threshold" initialValue={10}>
                                                <InputNumber style={{ width: "100%" }} size="large" min={1} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item name="supplierId" label="Supplier">
                                                <Select placeholder="Select Supplier" size="large" allowClear>
                                                    {suppliers.map(s => (
                                                        <Option key={s.id} value={s.id}>{s.name}</Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <div className="flex gap-6 mt-2">
                                        <Form.Item name="bestseller" valuePropName="checked">
                                            <Checkbox>Mark as Bestseller</Checkbox>
                                        </Form.Item>
                                        <Form.Item name="new" valuePropName="checked">
                                            <Checkbox>Mark as New</Checkbox>
                                        </Form.Item>
                                    </div>
                                </Card>
                            </Col>

                            <Col xs={24} md={8}>
                                <Card type="inner" title="Product Image" className="mb-6">
                                    <CloudinaryUpload
                                        onUploadSuccess={(url) => setImageUrl(url)}
                                        onRemove={() => setImageUrl(null)}
                                    />
                                    {!imageUrl && (
                                        <div className="text-red-500 mt-2 text-sm">
                                            * Image is required
                                        </div>
                                    )}
                                </Card>
                            </Col>
                        </Row>

                        <Divider />

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                size="large"
                                icon={<SaveOutlined />}
                                loading={submitting}
                                block
                                style={{
                                    background: "#047857",
                                    borderColor: "#047857",
                                    height: 48,
                                    fontSize: 16,
                                    fontWeight: "bold"
                                }}
                            >
                                Save Product
                            </Button>
                        </Form.Item>
                    </Form>
                )}
            </Card>
        </div>
    );
};

export default AddProductPage;
