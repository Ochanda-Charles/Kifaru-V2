"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import api from "@/app/utilis/api";
import {
  Layout,
  Card,
  Row,
  Col,
  Statistic,
  Tabs,
  DatePicker,
  Button,
  Table,
  Select,
  Typography,
  Space,
  message,
  Empty,
  Spin
} from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  DownloadOutlined,
  PrinterOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  WarningOutlined,
  DollarOutlined,
  StockOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

const { Content } = Layout;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// --- Types ---
interface DashboardMetrics {
  totalProducts: number;
  totalStockUnits: number;
  totalInventoryValue: number;
  avgPrice: number;
  stockByCategory: { name: string; value: number }[];
  topProductsByValue: { name: string; value: number }[];
  movementSummary: { in: number; out: number; net: number };
}

interface StockMovement {
  date: string;
  in: number;
  out: number;
  type: string;
}

interface LowStockItem {
  id: number;
  name: string;
  currentStock: number;
  threshold: number;
  deficit: number;
  lastRestocked: string;
}

interface ValuationData {
  totalValue: number;
  byCategory: { category: string; value: number; count: number }[];
  history: { date: string; value: number }[];
}

// --- Mock Data (Fallbacks) ---
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

const InventoryReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("summary");
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(30, "day"),
    dayjs(),
  ]);
  const [aggregatedBy, setAggregatedBy] = useState<"day" | "week" | "month">("day");
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [valuation, setValuation] = useState<ValuationData | null>(null);

  // Helper to fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const merchant_id = localStorage.getItem("merchant_id");
      const startDate = dateRange[0].format("YYYY-MM-DD");
      const endDate = dateRange[1].format("YYYY-MM-DD");

      const baseURL = "https://kifaruswypt.onrender.com";

      // Fetch based on active tab
      // Note: Assuming a versatile endpoint or separate endpoints. 
      // Note: Assuming a versatile endpoint or separate endpoints.
      // Using a generic structure as requested: GET /inventory/report?type={type}...

      const params = {
        type: activeTab,
        start_date: startDate,
        end_date: endDate,
        merchant_id,
        aggregation: aggregatedBy
      };

      const response = await api.get("/inventory/report", { params }); // Using api utility and relative path

      if (response.data?.success) {
        const data = response.data.data;
        if (activeTab === "summary") setMetrics(data);
        else if (activeTab === "movements") setMovements(data);
        else if (activeTab === "low_stock") setLowStockItems(data);
        else if (activeTab === "valuation") setValuation(data);
      } else {
        // Fallback/Mock logic if API returns empty or success:token issue
        // DO NOT USE IN PRODUCTION - strictly for demo if API isn't ready
        console.warn("Using mock data as API response was not successful or empty");
        if (activeTab === "summary") loadMockSummary();
        if (activeTab === "movements") loadMockMovements();
        if (activeTab === "low_stock") loadMockLowStock();
        if (activeTab === "valuation") loadMockValuation();
      }

    } catch (error) {
      console.error("Error fetching report data:", error);
      // message.error("Failed to fetch report data.");
      // Fallback to mocks on error for development demonstration
      if (activeTab === "summary") loadMockSummary();
      if (activeTab === "movements") loadMockMovements();
      if (activeTab === "low_stock") loadMockLowStock();
      if (activeTab === "valuation") loadMockValuation();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, dateRange, aggregatedBy]);

  // --- Mocks ---
  const loadMockSummary = () => {
    setMetrics({
      totalProducts: 45,
      totalStockUnits: 1250,
      totalInventoryValue: 450000,
      avgPrice: 360,
      stockByCategory: [
        { name: "Electronics", value: 400 },
        { name: "Clothing", value: 300 },
        { name: "Home", value: 300 },
        { name: "Books", value: 200 },
      ],
      topProductsByValue: [
        { name: "Laptop X1", value: 120000 },
        { name: "Phone Y2", value: 80000 },
        { name: "Headphones Z", value: 40000 },
        { name: "Smart Watch", value: 35000 },
        { name: "Tablet A", value: 30000 },
      ],
      movementSummary: { in: 150, out: 120, net: 30 },
    });
  };

  const loadMockMovements = () => {
    const data = [];
    for (let i = 0; i < 7; i++) {
      data.push({
        date: dayjs().subtract(6 - i, 'day').format('YYYY-MM-DD'),
        in: Math.floor(Math.random() * 50),
        out: Math.floor(Math.random() * 40),
        type: 'Movement'
      });
    }
    setMovements(data);
  };

  const loadMockLowStock = () => {
    setLowStockItems([
      { id: 1, name: "Wireless Mouse", currentStock: 2, threshold: 10, deficit: 8, lastRestocked: "2023-10-01" },
      { id: 2, name: "USB Cable", currentStock: 5, threshold: 20, deficit: 15, lastRestocked: "2023-09-15" },
      { id: 3, name: "Notebook", currentStock: 1, threshold: 5, deficit: 4, lastRestocked: "2023-11-20" },
    ]);
  };

  const loadMockValuation = () => {
    setValuation({
      totalValue: 450000,
      byCategory: [
        { category: "Electronics", value: 250000, count: 15 },
        { category: "Clothing", value: 100000, count: 20 },
        { category: "Home", value: 100000, count: 10 },
      ],
      history: Array.from({ length: 12 }, (_, i) => ({
        date: dayjs().subtract(11 - i, 'month').format('MMM YYYY'),
        value: 400000 + Math.random() * 50000
      }))
    });
  };

  // --- Renderers ---

  const renderSummary = () => {
    if (!metrics) return <Empty description="No data availabe" />;
    return (
      <>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic title="Total Products" value={metrics.totalProducts} prefix={<StockOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="Total Stock Units" value={metrics.totalStockUnits} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="Total Inventory Value" value={metrics.totalInventoryValue} prefix="KES" precision={2} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="Avg Product Price" value={metrics.avgPrice} prefix="KES" precision={2} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="Stock by Category">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={metrics.stockByCategory}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {metrics.stockByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Top 5 Products by Value">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.topProductsByValue} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#82ca9d" name="Value (KES)" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      </>
    );
  };

  const renderMovements = () => (
    <Card title="Stock Movements Over Time" extra={
      <Select value={aggregatedBy} onChange={setAggregatedBy} style={{ width: 120 }}>
        <Option value="day">Daily</Option>
        <Option value="week">Weekly</Option>
        <Option value="month">Monthly</Option>
      </Select>
    }>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={movements}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="in" stroke="#82ca9d" name="Stock In" />
          <Line type="monotone" dataKey="out" stroke="#8884d8" name="Stock Out" />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );

  const renderLowStock = () => {
    const columns = [
      { title: "Product", dataIndex: "name", key: "name" },
      { title: "Current Stock", dataIndex: "currentStock", key: "currentStock" },
      { title: "Threshold", dataIndex: "threshold", key: "threshold" },
      { title: "Deficit", dataIndex: "deficit", key: "deficit", render: (val: number) => <Text type="danger">{val}</Text> },
      { title: "Last Restocked", dataIndex: "lastRestocked", key: "lastRestocked" },
    ];

    return (
      <Card title="Low Stock Report" extra={<Button type="primary">Restock All</Button>}>
        <Table dataSource={lowStockItems} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>
    );
  };

  const renderValuation = () => {
    if (!valuation) return <Empty />;
    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Statistic title="Total Inventory Valuation" value={valuation.totalValue} prefix="KES" precision={2} valueStyle={{ color: '#3f8600' }} />
        </Card>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="Valuation by Category">
              <Table
                dataSource={valuation.byCategory}
                rowKey="category"
                pagination={false}
                columns={[
                  { title: "Category", dataIndex: "category" },
                  { title: "Item Count", dataIndex: "count" },
                  { title: "Value (KES)", dataIndex: "value", render: val => val.toLocaleString() }
                ]}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Valuation History">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={valuation.history}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" name="Total Value" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      </Space>
    );
  };

  const handleExport = (format: "csv" | "pdf") => {
    message.success(`Exporting as ${format.toUpperCase()}...`);
    // Implement actual export logic here 
    // e.g. window.open('.../export?format=' + format)
  };

  return (
    <div style={{ padding: 24, paddingBottom: 50 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Inventory Reports</Title>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={() => handleExport('csv')}>Export CSV</Button>
          <Button icon={<PrinterOutlined />} onClick={() => handleExport('pdf')}>Print PDF</Button>
        </Space>
      </div>

      <div style={{ marginBottom: 24, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <RangePicker
          value={dateRange}
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) setDateRange([dates[0], dates[1]]);
          }}
          presets={[
            { label: 'Last 7 Days', value: [dayjs().subtract(7, 'd'), dayjs()] },
            { label: 'Last 30 Days', value: [dayjs().subtract(30, 'd'), dayjs()] },
            { label: 'This Month', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
          ]}
        />
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        items={[
          {
            key: "summary",
            label: "Summary Overview",
            children: loading ? <Spin size="large" /> : renderSummary()
          },
          {
            key: "movements",
            label: "Stock Movements",
            children: loading ? <Spin size="large" /> : renderMovements()
          },
          {
            key: "low_stock",
            label: <Space><WarningOutlined /> Low Stock</Space>,
            children: loading ? <Spin size="large" /> : renderLowStock()
          },
          {
            key: "valuation",
            label: <Space><DollarOutlined /> Valuation</Space>,
            children: loading ? <Spin size="large" /> : renderValuation()
          }
        ]}
      />
    </div>
  );
};

export default InventoryReportsPage;
