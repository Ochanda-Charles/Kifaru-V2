"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import api from "@/app/utilis/api";
import { jwtDecode } from "jwt-decode";
import {
    Layout,
    Menu,
    Button,
    Modal,
    Table,
    message,
    Card,
    Row,
    Col,
    Typography,
    Progress,
    Statistic,
    List,
    Tag,
    Spin,
    Empty,
} from "antd";
import {
    UserOutlined,
    DollarOutlined,
    ShopOutlined,
    BarChartOutlined,
    WarningOutlined,
    ExportOutlined,
    AlertOutlined,
    ToolOutlined,
    InboxOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
} from "@ant-design/icons";
import Link from "next/link";

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

// Types
type SummaryData = {
    totalProducts: number;
    totalStockValue: number;
    lowStockItems: number;
    outOfStock: number;
};

type Movement = {
    id: number;
    date: string;
    product_name: string;
    movement_type: "IN" | "OUT" | "SALE" | "ADJUSTMENT";
    quantity_change: number;
    reason: string;
};

type Alert = {
    id: number;
    product_id: number;
    product_name: string;
    current_quantity: number;
    threshold: number;
    created_at: string;
};

type Product = {
    id: number;
    name: string;
    quantity: number;
    price: number;
};

const InventoryDashboard: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [merchantUsername, setMerchantUsername] = useState("User");
    const [merchantId, setMerchantId] = useState<string | null>(null);

    // Data states
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [movements, setMovements] = useState<Movement[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [topProducts, setTopProducts] = useState<Product[]>([]);

    // UI states
    const [loading, setLoading] = useState(true);
    const [alertsModalVisible, setAlertsModalVisible] = useState(false);

    // Initialize auth and fetch data
    useEffect(() => {
        const token = localStorage.getItem("merchantToken");
        if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

            try {
                const decoded: any = jwtDecode(token);
                const user = decoded.merchantUserName || decoded.merchantusername || decoded.sub || "User";
                const id = decoded.merchant_id || decoded.sub || null;
                setMerchantUsername(user);
                setMerchantId(id);
            } catch (error) {
                console.error("Token decode error:", error);
            }
        }
    }, []);

    // Fetch all data when merchantId is available
    useEffect(() => {
        if (merchantId) {
            fetchAllData();
        }
    }, [merchantId]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchSummary(),
                fetchMovements(),
                fetchAlerts(),
                fetchTopProducts(),
            ]);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSummary = async () => {
        try {
            const response = await axios.get(
                `https://kifaruswypt.onrender.com/inventory/report?type=summary&merchant_id=${merchantId}`
            );
            setSummary(response.data);
        } catch (error) {
            console.error("Error fetching summary:", error);
            // Fallback to calculating from products
            try {
                const productsRes = await axios.get(
                    `https://kifaruswypt.onrender.com/getMerchantProducts/${merchantId}`
                );
                const products = productsRes.data.data || [];
                const calculated: SummaryData = {
                    totalProducts: products.length,
                    totalStockValue: products.reduce((sum: number, p: Product) => sum + (p.price * p.quantity), 0),
                    lowStockItems: products.filter((p: Product) => p.quantity > 0 && p.quantity <= 10).length,
                    outOfStock: products.filter((p: Product) => p.quantity === 0).length,
                };
                setSummary(calculated);
                setTopProducts(products.sort((a: Product, b: Product) => b.quantity - a.quantity).slice(0, 10));
            } catch (err) {
                console.error("Error fetching products for summary:", err);
            }
        }
    };

    const fetchMovements = async () => {
        try {
            const response = await axios.get(
                `https://kifaruswypt.onrender.com/inventory/movements?limit=10&merchant_id=${merchantId}`
            );
            setMovements(response.data.data || []);
        } catch (error) {
            console.error("Error fetching movements:", error);
            setMovements([]);
        }
    };

    const fetchAlerts = async () => {
        try {
            const response = await axios.get(
                `https://kifaruswypt.onrender.com/inventory/alerts?unread=true&merchant_id=${merchantId}`
            );
            setAlerts(response.data.data || []);
        } catch (error) {
            console.error("Error fetching alerts:", error);
            setAlerts([]);
        }
    };

    const fetchTopProducts = async () => {
        try {
            const productsRes = await axios.get(
                `https://kifaruswypt.onrender.com/getMerchantProducts/${merchantId}`
            );
            const products = productsRes.data.data || [];
            setTopProducts(products.sort((a: Product, b: Product) => b.quantity - a.quantity).slice(0, 10));
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    const handleExportCSV = () => {
        if (!topProducts.length) {
            message.warning("No data to export");
            return;
        }

        const headers = ["Product Name", "Quantity", "Price", "Stock Value"];
        const rows = topProducts.map(p => [
            p.name,
            p.quantity,
            p.price,
            p.price * p.quantity
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `inventory_report_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        message.success("Report exported successfully!");
    };

    const handleRestock = (productId: number, productName: string) => {
        message.info(`Restock action for ${productName} - Navigate to adjust stock page`);
        // This would typically navigate to the adjust page with the product pre-selected
        window.location.href = `/merchants/dashboard/inventory/adjust?product=${productId}`;
    };

    const handleLogout = () => {
        localStorage.removeItem("merchantToken");
        localStorage.removeItem("your_wallet_address");
        localStorage.removeItem("merchant_id");
        axios.defaults.headers.common["Authorization"] = "";
        window.location.href = "/";
    };

    const movementColumns = [
        {
            title: "Date",
            dataIndex: "date",
            key: "date",
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
        {
            title: "Product",
            dataIndex: "product_name",
            key: "product_name",
        },
        {
            title: "Type",
            dataIndex: "movement_type",
            key: "movement_type",
            render: (type: string) => {
                const colors: Record<string, string> = {
                    IN: "green",
                    OUT: "red",
                    SALE: "blue",
                    ADJUSTMENT: "orange",
                };
                return <Tag color={colors[type] || "default"}>{type}</Tag>;
            },
        },
        {
            title: "Qty Change",
            dataIndex: "quantity_change",
            key: "quantity_change",
            render: (qty: number) => (
                <span style={{ color: qty > 0 ? "#52c41a" : "#ff4d4f" }}>
                    {qty > 0 ? `+${qty}` : qty}
                </span>
            ),
        },
        {
            title: "Reason",
            dataIndex: "reason",
            key: "reason",
            ellipsis: true,
        },
    ];

    // Calculate max quantity for chart scaling
    const maxQuantity = Math.max(...topProducts.map(p => p.quantity), 1);

    return (
        <>
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Spin size="large" tip="Loading inventory data..." />
                </div>
            ) : (
                <>
                    {/* Summary Cards Row */}
                    <Row gutter={[16, 16]} className="mb-6">
                        <Col xs={24} sm={12} lg={6}>
                            <Card
                                className="shadow-lg hover:shadow-xl transition-shadow"
                                style={{
                                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                    borderRadius: 12,
                                    border: "none",
                                }}
                            >
                                <Statistic
                                    title={<span style={{ color: "rgba(255,255,255,0.8)" }}>Total Products</span>}
                                    value={summary?.totalProducts || 0}
                                    prefix={<InboxOutlined />}
                                    valueStyle={{ color: "white", fontWeight: "bold" }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card
                                className="shadow-lg hover:shadow-xl transition-shadow"
                                style={{
                                    background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
                                    borderRadius: 12,
                                    border: "none",
                                }}
                            >
                                <Statistic
                                    title={<span style={{ color: "rgba(255,255,255,0.8)" }}>Total Stock Value</span>}
                                    value={summary?.totalStockValue || 0}
                                    prefix="KSH"
                                    precision={2}
                                    valueStyle={{ color: "white", fontWeight: "bold" }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card
                                className="shadow-lg hover:shadow-xl transition-shadow"
                                style={{
                                    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                                    borderRadius: 12,
                                    border: "none",
                                }}
                            >
                                <Statistic
                                    title={<span style={{ color: "rgba(255,255,255,0.8)" }}>Low Stock Items</span>}
                                    value={summary?.lowStockItems || 0}
                                    prefix={<WarningOutlined />}
                                    valueStyle={{ color: "white", fontWeight: "bold" }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card
                                className="shadow-lg hover:shadow-xl transition-shadow"
                                style={{
                                    background: "linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)",
                                    borderRadius: 12,
                                    border: "none",
                                }}
                            >
                                <Statistic
                                    title={<span style={{ color: "rgba(255,255,255,0.8)" }}>Out of Stock</span>}
                                    value={summary?.outOfStock || 0}
                                    prefix={<AlertOutlined />}
                                    valueStyle={{ color: "white", fontWeight: "bold" }}
                                />
                            </Card>
                        </Col>
                    </Row>

                    {/* Quick Actions */}
                    <Card
                        className="shadow-lg mb-6"
                        style={{
                            borderRadius: 12,
                            background: "rgba(255,255,255,0.95)",
                        }}
                    >
                        <div className="flex flex-wrap gap-4">
                            <Link href="/merchants/dashboard/inventory/adjust">
                                <Button
                                    type="primary"
                                    size="large"
                                    icon={<ToolOutlined />}
                                    style={{
                                        background: "#047857",
                                        borderColor: "#047857",
                                        borderRadius: 8,
                                        fontWeight: 600,
                                    }}
                                >
                                    Adjust Stock
                                </Button>
                            </Link>
                            <Button
                                size="large"
                                icon={<AlertOutlined />}
                                onClick={() => setAlertsModalVisible(true)}
                                style={{
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    borderColor: "#f5576c",
                                    color: "#f5576c",
                                }}
                            >
                                View Alerts ({alerts.length})
                            </Button>
                            <Button
                                size="large"
                                icon={<ExportOutlined />}
                                onClick={handleExportCSV}
                                style={{
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    borderColor: "#667eea",
                                    color: "#667eea",
                                }}
                            >
                                Export Report
                            </Button>
                        </div>
                    </Card>

                    {/* Stock Levels Chart + Low Stock Alerts */}
                    <Row gutter={[16, 16]} className="mb-6">
                        <Col xs={24} lg={14}>
                            <Card
                                title={
                                    <span className="font-semibold text-lg">
                                        <BarChartOutlined className="mr-2" /> Top 10 Products by Stock
                                    </span>
                                }
                                className="shadow-lg"
                                style={{ borderRadius: 12, background: "rgba(255,255,255,0.95)" }}
                            >
                                {topProducts.length > 0 ? (
                                    <div className="space-y-3">
                                        {topProducts.map((product) => (
                                            <div key={product.id} className="flex items-center gap-3">
                                                <div className="w-32 truncate font-medium" title={product.name}>
                                                    {product.name}
                                                </div>
                                                <Progress
                                                    percent={Math.round((product.quantity / maxQuantity) * 100)}
                                                    format={() => product.quantity}
                                                    strokeColor={{
                                                        "0%": "#667eea",
                                                        "100%": "#764ba2",
                                                    }}
                                                    style={{ flex: 1 }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <Empty description="No products found" />
                                )}
                            </Card>
                        </Col>
                        <Col xs={24} lg={10}>
                            <Card
                                title={
                                    <span className="font-semibold text-lg">
                                        <WarningOutlined className="mr-2 text-orange-500" /> Low Stock Alerts
                                    </span>
                                }
                                className="shadow-lg"
                                style={{
                                    borderRadius: 12,
                                    background: "rgba(255,255,255,0.95)",
                                    maxHeight: 400,
                                    overflow: "auto",
                                }}
                            >
                                {alerts.length > 0 ? (
                                    <List
                                        dataSource={alerts}
                                        renderItem={(alert) => (
                                            <List.Item
                                                actions={[
                                                    <Button
                                                        key="restock"
                                                        type="primary"
                                                        size="small"
                                                        style={{ background: "#047857", borderColor: "#047857" }}
                                                        onClick={() => handleRestock(alert.product_id, alert.product_name)}
                                                    >
                                                        Restock
                                                    </Button>,
                                                ]}
                                            >
                                                <List.Item.Meta
                                                    title={
                                                        <span className="font-medium">
                                                            {alert.product_name}
                                                        </span>
                                                    }
                                                    description={
                                                        <span className="text-red-500">
                                                            Stock: {alert.current_quantity} / Threshold: {alert.threshold}
                                                        </span>
                                                    }
                                                />
                                            </List.Item>
                                        )}
                                    />
                                ) : (
                                    <Empty description="No low stock alerts" />
                                )}
                            </Card>
                        </Col>
                    </Row>

                    {/* Recent Movements Table */}
                    <Card
                        title={
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-lg">
                                    <ArrowUpOutlined className="mr-2 text-green-500" />
                                    <ArrowDownOutlined className="mr-1 text-red-500" />
                                    Recent Stock Movements
                                </span>
                                <Link href="/merchants/dashboard/inventory/history">
                                    <Button type="link">View All →</Button>
                                </Link>
                            </div>
                        }
                        className="shadow-lg"
                        style={{ borderRadius: 12, background: "rgba(255,255,255,0.95)" }}
                    >
                        {movements.length > 0 ? (
                            <Table
                                dataSource={movements}
                                columns={movementColumns}
                                rowKey="id"
                                pagination={false}
                                size="middle"
                            />
                        ) : (
                            <Empty description="No recent stock movements" />
                        )}
                    </Card>
                </>
            )}

            {/* Alerts Modal */}
            <Modal
                title={
                    <span>
                        <AlertOutlined className="mr-2 text-red-500" />
                        Low Stock Alerts
                    </span>
                }
                open={alertsModalVisible}
                onCancel={() => setAlertsModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setAlertsModalVisible(false)}>
                        Close
                    </Button>,
                ]}
                width={600}
            >
                {alerts.length > 0 ? (
                    <List
                        dataSource={alerts}
                        renderItem={(alert) => (
                            <List.Item
                                actions={[
                                    <Tag key="qty" color="red">
                                        Qty: {alert.current_quantity}
                                    </Tag>,
                                    <Button
                                        key="restock"
                                        type="primary"
                                        size="small"
                                        style={{ background: "#047857", borderColor: "#047857" }}
                                        onClick={() => {
                                            setAlertsModalVisible(false);
                                            handleRestock(alert.product_id, alert.product_name);
                                        }}
                                    >
                                        Restock
                                    </Button>,
                                ]}
                            >
                                <List.Item.Meta
                                    title={alert.product_name}
                                    description={`Threshold: ${alert.threshold} units`}
                                />
                            </List.Item>
                        )}
                    />
                ) : (
                    <Empty description="No low stock alerts at this time" />
                )}
            </Modal>
        </>
    );
};

export default InventoryDashboard;
