"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import api from "@/app/utilis/api";
import { jwtDecode } from "jwt-decode";
import {
    Layout,
    Menu,
    Button,
    Card,
    Table,
    Tag,
    Row,
    Col,
    Typography,
    DatePicker,
    Select,
    Space,
    message,
    Tooltip,
} from "antd";
import {
    UserOutlined,
    DollarOutlined,
    ShopOutlined,
    BarChartOutlined,
    ArrowLeftOutlined,
    ExportOutlined,
    FilterOutlined,
    ReloadOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

type Movement = {
    id: number;
    date: string;
    product_name: string;
    movement_type: "IN" | "OUT" | "SALE" | "ADJUSTMENT" | "RETURN";
    quantity_change: number;
    stock_before: number; // Assuming backend provides this based on request
    stock_after: number;  // Assuming backend provides this
    reason: string;
    reference: string;
    performed_by: string; // User who did it
};

type Product = {
    id: number;
    name: string;
};

const MovementHistoryPage: React.FC = () => {
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const [merchantUsername, setMerchantUsername] = useState("User");
    const [merchantId, setMerchantId] = useState<string | null>(null);

    // Data states
    const [movements, setMovements] = useState<Movement[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>([
        dayjs().subtract(30, 'days'),
        dayjs()
    ]);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<number | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);

    // Initialize auth
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

    useEffect(() => {
        if (merchantId) {
            fetchProducts();
            fetchMovements();
        }
    }, [merchantId, currentPage, pageSize, selectedType, selectedProduct, dateRange]);

    const fetchProducts = async () => {
        try {
            const response = await api.get(
                `/getMerchantProducts/${merchantId}`
            );
            setProducts(response.data.data || []);
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    const fetchMovements = async () => {
        setLoading(true);
        try {
            const params: any = {
                merchant_id: merchantId,
                page: currentPage,
                limit: pageSize,
            };

            if (selectedType) params.type = selectedType;
            if (selectedProduct) params.product_id = selectedProduct;
            if (dateRange) {
                params.startDate = dateRange[0].toISOString();
                params.endDate = dateRange[1].toISOString();
            }

            const response = await axios.get("https://kifaruswypt.onrender.com/inventory/movements", { params });

            // Handle different potential response structures
            const data = response.data;
            if (Array.isArray(data)) {
                // If API returns direct array (pagination might be missing in some basic implementations)
                setMovements(data);
                setTotal(data.length);
            } else if (data.data) {
                setMovements(data.data);
                setTotal(data.total || data.data.length); // Fallback if total not explicitly sent
            } else {
                setMovements([]);
                setTotal(0);
            }

        } catch (error) {
            console.error("Error fetching movements:", error);
            message.error("Failed to fetch movement history");
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (movements.length === 0) {
            message.warning("No data to export");
            return;
        }

        // Ideally fetch ALL data for export, but for now export current view or filtered set
        // If we want to export all filtered data, we might need a separate API call without pagination
        // For this implementation, let's export what we currently have or fetch a larger limit if needed.
        // Let's implement a "client side export of current page" for simplicity unless "Export All" is critical.
        // Requirement says "Export to CSV button".

        const headers = ["Date", "Product", "Type", "Change", "Stock Before", "Stock After", "Reason", "Reference", "User"];
        const rows = movements.map(m => [
            dayjs(m.date).format("YYYY-MM-DD HH:mm:ss"),
            `"${m.product_name}"`, // Quote to handle commas
            m.movement_type,
            m.quantity_change,
            m.stock_before ?? "-", // Handle missing if backend doesn't send it yet
            m.stock_after ?? "-",
            `"${m.reason}"`,
            m.reference || "-",
            m.performed_by || "-"
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `stock_movements_${dayjs().format("YYYY-MM-DD")}.csv`;
        link.click();
    };

    const handleLogout = () => {
        localStorage.removeItem("merchantToken");
        localStorage.removeItem("your_wallet_address");
        localStorage.removeItem("merchant_id");
        axios.defaults.headers.common["Authorization"] = "";
        window.location.href = "/";
    };

    const columns: any = [
        {
            title: "Date/Time",
            dataIndex: "date",
            key: "date",
            render: (date: string) => <span style={{ whiteSpace: "nowrap" }}>{dayjs(date).format("MMM D, YYYY HH:mm")}</span>,
        },
        {
            title: "Product",
            dataIndex: "product_name",
            key: "product_name",
            render: (text: string) => <span className="font-semibold">{text}</span>
        },
        {
            title: "Type",
            dataIndex: "movement_type",
            key: "movement_type",
            render: (type: string) => {
                let color = "default";
                switch (type) {
                    case "IN": color = "success"; break;
                    case "OUT": color = "error"; break;
                    case "SALE": color = "processing"; break;
                    case "RETURN": color = "warning"; break;
                    case "ADJUSTMENT": color = "volcano"; break;
                }
                return <Tag color={color}>{type}</Tag>;
            }
        },
        {
            title: "Change",
            dataIndex: "quantity_change",
            key: "quantity_change",
            render: (qty: number) => (
                <span className={qty > 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                    {qty > 0 ? "+" : ""}{qty}
                </span>
            )
        },
        {
            title: "Stock",
            key: "stock",
            render: (_: any, record: Movement) => (
                <Space>
                    <span className="text-gray-400">{record.stock_before ?? "?"}</span>
                    <span>→</span>
                    <span className="font-bold">{record.stock_after ?? "?"}</span>
                </Space>
            )
        },
        {
            title: "Reason",
            dataIndex: "reason",
            key: "reason",
            ellipsis: {
                showTitle: false,
            },
            render: (reason: string) => (
                <Tooltip placement="topLeft" title={reason}>
                    {reason}
                </Tooltip>
            ),
        },
        {
            title: "Ref",
            dataIndex: "reference",
            key: "reference",
            render: (text: string) => <Text type="secondary" style={{ fontSize: 12 }}>{text || "-"}</Text>
        },
        // Optional: Performed By
        {
            title: "User",
            dataIndex: "performed_by",
            key: "performed_by",
            responsive: ["lg"],
            render: (text: string) => <Text type="secondary" style={{ fontSize: 12 }}>{text || "System"}</Text>
        }
    ];

    return (
        <Layout
            style={{
                minHeight: "100vh",
                background: "linear-gradient(to right, #D8B4FE, #C084FC, #A78BFA)",
            }}
        >
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                theme="dark"
                style={{
                    position: "fixed",
                    left: 20,
                    top: 90,
                    bottom: 20,
                    borderRadius: 8,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
                }}
            >
                <div
                    style={{
                        height: 64,
                        color: "white",
                        fontWeight: "bold",
                        fontSize: 18,
                        textAlign: "center",
                        marginTop: 25,
                        marginBottom: 20,
                    }}
                />
                <Menu
                    theme="dark"
                    defaultSelectedKeys={["inventory"]}
                    mode="inline"
                    className="spaced-menu"
                    items={[
                        {
                            key: "dashboard",
                            icon: <ShopOutlined />,
                            label: <Link href="/merchants/dashboard">Dashboard</Link>,
                        },
                        {
                            key: "inventory",
                            icon: <BarChartOutlined />,
                            label: <Link href="/merchants/dashboard/inventory">Inventory</Link>,
                        },
                        { key: "clients", icon: <UserOutlined />, label: "Clients" },
                        { key: "wallet", icon: <DollarOutlined />, label: "My Wallet" },
                    ]}
                />
            </Sider>

            <Layout>
                <Header
                    style={{
                        position: "fixed",
                        top: 10,
                        left: 10,
                        right: 10,
                        zIndex: 100,
                        paddingLeft: 24,
                        padding: 24,
                        backgroundColor: "#111827",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.6)",
                        height: 64,
                        display: "flex",
                        marginBottom: 20,
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Title level={4} style={{ color: "white", margin: 30, userSelect: "none" }}>
                        Inventory History
                    </Title>
                    <button
                        onClick={handleLogout}
                        style={{
                            backgroundColor: "transparent",
                            border: "3px solid white",
                            color: "white",
                            marginRight: "30px",
                            padding: "2px",
                            borderRadius: 30,
                            cursor: "pointer",
                            maxHeight: 60,
                            marginTop: "10px",
                            minWidth: 120,
                            fontWeight: "bold",
                        }}
                    >
                        Logout
                    </button>
                </Header>

                <Content
                    style={{
                        marginTop: 130,
                        marginLeft: 250,
                        marginRight: 24,
                        marginBottom: 24,
                    }}
                >
                    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                        <div className="flex justify-between items-center mb-4">
                            <Button
                                type="link"
                                icon={<ArrowLeftOutlined />}
                                onClick={() => router.back()}
                                style={{ color: "#1f2937", fontWeight: "bold", padding: 0 }}
                            >
                                Back to Inventory
                            </Button>

                            <Button
                                icon={<ExportOutlined />}
                                onClick={handleExportCSV}
                                style={{ background: "#fff", borderColor: "#d9d9d9" }}
                            >
                                Export CSV
                            </Button>
                        </div>

                        <Card
                            className="shadow-lg mb-6"
                            style={{ borderRadius: 12, background: "rgba(255,255,255,0.95)" }}
                        >
                            <Row gutter={[16, 16]} align="middle">
                                <Col xs={24} md={8} lg={6}>
                                    <span className="mb-1 block text-gray-500 text-sm">Date Range</span>
                                    <RangePicker
                                        style={{ width: "100%" }}
                                        value={dateRange}
                                        onChange={(dates) => {
                                            // Fix for AntD type issue where dates can be null
                                            if (dates && dates[0] && dates[1]) {
                                                setDateRange([dates[0], dates[1]]);
                                            } else {
                                                setDateRange(null);
                                            }
                                        }}
                                    />
                                </Col>
                                <Col xs={24} md={6} lg={5}>
                                    <span className="mb-1 block text-gray-500 text-sm">Movement Type</span>
                                    <Select
                                        style={{ width: "100%" }}
                                        placeholder="All Types"
                                        allowClear
                                        onChange={setSelectedType}
                                    >
                                        <Option value="IN">Stock In</Option>
                                        <Option value="OUT">Stock Out</Option>
                                        <Option value="SALE">Sale</Option>
                                        <Option value="RETURN">Return</Option>
                                        <Option value="ADJUSTMENT">Adjustment</Option>
                                    </Select>
                                </Col>
                                <Col xs={24} md={6} lg={5}>
                                    <span className="mb-1 block text-gray-500 text-sm">Product</span>
                                    <Select
                                        style={{ width: "100%" }}
                                        placeholder="All Products"
                                        allowClear
                                        showSearch
                                        optionFilterProp="children"
                                        onChange={setSelectedProduct}
                                    >
                                        {products.map(p => (
                                            <Option key={p.id} value={p.id}>{p.name}</Option>
                                        ))}
                                    </Select>
                                </Col>
                                <Col xs={24} md={4} lg={4} style={{ display: "flex", alignItems: "flex-end" }}>
                                    <Button
                                        icon={<ReloadOutlined />}
                                        onClick={fetchMovements}
                                        style={{ width: "100%", marginTop: 22 }}
                                    >
                                        Refresh
                                    </Button>
                                </Col>
                            </Row>
                        </Card>

                        <Card
                            className="shadow-lg"
                            bodyStyle={{ padding: 0 }}
                            style={{ borderRadius: 12, overflow: "hidden", background: "rgba(255,255,255,0.95)" }}
                        >
                            <Table
                                dataSource={movements}
                                columns={columns}
                                rowKey="id"
                                loading={loading}
                                pagination={{
                                    current: currentPage,
                                    pageSize: pageSize,
                                    total: total,
                                    onChange: (page, size) => {
                                        setCurrentPage(page);
                                        setPageSize(size);
                                    },
                                    showSizeChanger: true,
                                }}
                                scroll={{ x: 800 }}
                            />
                        </Card>
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};

export default MovementHistoryPage;
