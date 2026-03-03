"use client";

import React, { useEffect, useState } from "react";
import api from "@/app/utilis/api";
import { jwtDecode } from "jwt-decode";
import {
    Button,
    Modal,
    Card,
    Row,
    Col,
    Typography,
    Form,
    Select,
    InputNumber,
    Input,
    Radio,
    message,
    Spin,
    Divider,
} from "antd";
import {
    ArrowLeftOutlined,
    SaveOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;
const { Option } = Select;

type Product = {
    id: number;
    name: string;
    quantity: number;
    price: number;
};

type Supplier = {
    id: number;
    name: string;
};

const StockAdjustmentPage: React.FC = () => {
    const router = useRouter();
    const [merchantId, setMerchantId] = useState<string | null>(null);
    const [form] = Form.useForm();

    // Data states
    const [products, setProducts] = useState<Product[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Selection states for preview
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [movementType, setMovementType] = useState<"IN" | "OUT" | "ADJUSTMENT">("IN");
    const [adjustmentQty, setAdjustmentQty] = useState<number>(0);

    // Initialize auth
    useEffect(() => {
        const token = localStorage.getItem("merchantToken");
        if (!token) return;

        try {
            const decoded: any = jwtDecode(token);
            const id = decoded.merchant_id || decoded.sub || null;

            if (id) {
                setMerchantId(id);
                fetchProducts(id);
                fetchSuppliers();
            }
        } catch (error) {
            console.error("Token decode error:", error);
        }
    }, []);

    const fetchProducts = async (mId: string) => {
        setLoading(true);
        try {
            const response = await api.get(`/getMerchantProducts/${mId}`);
            setProducts(response.data.data || []);
        } catch (error) {
            console.error("Error fetching products:", error);
            message.error("Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const response = await api.get("/inventory/suppliers");
            setSuppliers(response.data.data || []);
        } catch (error) {
            console.error("Error fetching suppliers:", error);
        }
    };

    const handleProductChange = (productId: number) => {
        const product = products.find(p => p.id === productId);
        setSelectedProduct(product || null);
    };

    const calculateNewStock = () => {
        if (!selectedProduct) return 0;
        const current = selectedProduct.quantity || 0;
        const change = adjustmentQty || 0;

        if (movementType === "IN") return current + change;
        if (movementType === "OUT") return Math.max(0, current - change);
        if (movementType === "ADJUSTMENT") return change;
        return movementType === "OUT" ? current - change : current + change;
    };

    const onFinish = async (values: any) => {
        if (!selectedProduct) return;

        setSubmitting(true);
        try {
            const payload = {
                product_id: values.productId,
                movement_type: values.movementType,
                quantity: values.quantity,
                reason: values.reason === "Other" ? values.customReason : values.reason,
                reference_id: values.reference || null,
                supplier_id: values.supplierId || null,
            };

            const stockBefore = selectedProduct.quantity;

            await api.post("/inventory/adjust", payload);

            if (merchantId) await fetchProducts(merchantId);

            Modal.success({
                title: "Stock Adjusted Successfully",
                content: (
                    <div>
                        <p>Stock updated for <strong>{selectedProduct.name}</strong></p>
                        <p>Movement: <strong style={{ color: values.movementType === 'IN' ? 'green' : 'red' }}>{values.movementType}</strong></p>
                        <p>Stock Level: {stockBefore} → <b>{
                            values.movementType === 'OUT' ? stockBefore - values.quantity : stockBefore + values.quantity
                        }</b></p>
                    </div>
                ),
                okText: "Done",
                onOk: () => router.push("/merchants/dashboard/inventory"),
                footer: (_, { OkBtn }) => (
                    <>
                        <Button onClick={() => {
                            form.resetFields();
                            setSelectedProduct(null);
                            setAdjustmentQty(0);
                            Modal.destroyAll();
                        }}>Make Another Adjustment</Button>
                        <OkBtn />
                    </>
                )
            });

        } catch (error) {
            console.error("Adjustment error:", error);
            message.error("Failed to adjust stock. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <Button
                type="link"
                icon={<ArrowLeftOutlined />}
                onClick={() => router.back()}
                style={{ marginBottom: 16, color: "#1f2937", fontWeight: "bold", padding: 0 }}
            >
                Back to Inventory
            </Button>

            <Card
                title={<span className="text-xl font-bold">Stock Adjustment</span>}
                className="shadow-lg"
                style={{ borderRadius: 12, background: "rgba(255,255,255,0.95)" }}
            >
                {loading && products.length === 0 ? (
                    <div className="flex justify-center p-8">
                        <Spin size="large" tip="Loading products..." />
                    </div>
                ) : (
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        initialValues={{
                            movementType: "IN",
                            quantity: 1,
                        }}
                    >
                        <Row gutter={24}>
                            <Col span={24}>
                                <Form.Item
                                    name="productId"
                                    label="Select Product"
                                    rules={[{ required: true, message: "Please select a product" }]}
                                >
                                    <Select
                                        showSearch
                                        placeholder="Search to select product"
                                        optionFilterProp="children"
                                        onChange={handleProductChange}
                                        filterOption={(input, option) =>
                                            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                        }
                                        options={products.map(p => ({
                                            value: p.id,
                                            label: `${p.name} (Current Stock: ${p.quantity})`
                                        }))}
                                        size="large"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        {selectedProduct && (
                            <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                                <Row gutter={16} align="middle">
                                    <Col span={8}>
                                        <Text type="secondary">Current Stock</Text>
                                        <div className="text-2xl font-bold">{selectedProduct.quantity}</div>
                                    </Col>
                                    <Col span={8}>
                                        <Text type="secondary">Product Price</Text>
                                        <div className="text-lg">KSH {selectedProduct.price}</div>
                                    </Col>
                                    <Col span={8}>
                                        <Text type="secondary">Estimated New Stock</Text>
                                        <div className={`text-2xl font-bold ${calculateNewStock() < 10 ? 'text-orange-500' : 'text-green-600'
                                            }`}>
                                            {calculateNewStock()}
                                        </div>
                                    </Col>
                                </Row>
                            </div>
                        )}

                        <Divider />

                        <Row gutter={24}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="movementType"
                                    label="Movement Type"
                                    rules={[{ required: true }]}
                                >
                                    <Radio.Group
                                        buttonStyle="solid"
                                        onChange={(e) => setMovementType(e.target.value)}
                                    >
                                        <Radio.Button value="IN">Stock In</Radio.Button>
                                        <Radio.Button value="OUT">Stock Out</Radio.Button>
                                        <Radio.Button value="ADJUSTMENT">Adjustment</Radio.Button>
                                    </Radio.Group>
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="quantity"
                                    label="Quantity"
                                    rules={[{ required: true, message: "Please enter quantity" }]}
                                >
                                    <InputNumber
                                        min={1}
                                        style={{ width: "100%" }}
                                        size="large"
                                        onChange={(val) => setAdjustmentQty(val || 0)}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={24}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="reason"
                                    label="Reason"
                                    rules={[{ required: true, message: "Please select a reason" }]}
                                >
                                    <Select placeholder="Select Reason" size="large">
                                        <Option value="Restock">Restock / Purchase</Option>
                                        <Option value="Sale">Direct Sale</Option>
                                        <Option value="Return">Customer Return</Option>
                                        <Option value="Damaged">Damaged / Expired</Option>
                                        <Option value="Lost">Lost / Theft</Option>
                                        <Option value="Correction">Inventory Correction</Option>
                                        <Option value="Other">Other</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    noStyle
                                    shouldUpdate={(prevValues, currentValues) => prevValues.reason !== currentValues.reason}
                                >
                                    {({ getFieldValue }) =>
                                        getFieldValue("reason") === "Other" ? (
                                            <Form.Item
                                                name="customReason"
                                                label="Specify Reason"
                                                rules={[{ required: true, message: "Please specify reason" }]}
                                            >
                                                <Input placeholder="Enter details..." size="large" />
                                            </Form.Item>
                                        ) : null
                                    }
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* Supplier field only for Stock In */}
                        <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, currentValues) => prevValues.movementType !== currentValues.movementType}
                        >
                            {({ getFieldValue }) =>
                                getFieldValue("movementType") === "IN" ? (
                                    <Row gutter={24}>
                                        <Col span={24}>
                                            <Form.Item name="supplierId" label="Supplier (Optional)">
                                                <Select placeholder="Select Supplier" size="large" allowClear>
                                                    {suppliers.map(s => (
                                                        <Option key={s.id} value={s.id}>{s.name}</Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                ) : null
                            }
                        </Form.Item>

                        <Row gutter={24}>
                            <Col span={24}>
                                <Form.Item name="reference" label="Reference Number (PO, Invoice #)">
                                    <Input placeholder="Optional reference..." size="large" />
                                </Form.Item>
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
                                Submit Adjustment
                            </Button>
                        </Form.Item>
                    </Form>
                )}
            </Card>
        </div>
    );
};

export default StockAdjustmentPage;
