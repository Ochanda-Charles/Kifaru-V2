"use client";

import React, { useEffect, useState } from "react";
import api from "@/app/utilis/api";
import {
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
  WarningOutlined,
  DollarOutlined,
  StockOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// --- Types (aligned to backend API response) ---
interface DashboardMetrics {
  totalProducts: number;
  totalStockUnits: number;
  totalInventoryValue: number;
  avgPrice: number;
  lowStockCount: number;
  outOfStockCount: number;
  stockByCategory: { name: string; value: number }[];
  topProductsByValue: { name: string; value: number }[];
  movementSummary: { in: number; out: number; net: number };
}

interface StockMovement {
  id: string;
  product_id: string;
  quantity_change: number;
  stock_before: number;
  stock_after: number;
  movement_type: string;
  reason: string | null;
  created_at: string;
}

interface LowStockProduct {
  id: string;
  name: string;
  quantity: number;
  low_stock_threshold: number;
  price: number;
}

interface ValuationData {
  totalValue: number;
  byCategory: { category: string; value: number; count: number }[];
  history: { date: string; value: number }[];
}

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
  const [lowStockItems, setLowStockItems] = useState<LowStockProduct[]>([]);
  const [valuation, setValuation] = useState<ValuationData | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const startDate = dateRange[0].format("YYYY-MM-DD");
      const endDate = dateRange[1].format("YYYY-MM-DD");

      const params: Record<string, string> = {
        type: activeTab,
        start_date: startDate,
        end_date: endDate,
      };

      const response = await api.get("/inventory/report", { params });

      if (response.data?.success) {
        const data = response.data.data;
        // Set data even if empty/null — the render functions handle empty states gracefully
        if (activeTab === "summary") setMetrics(data || null);
        else if (activeTab === "movements") setMovements(Array.isArray(data) ? data : []);
        else if (activeTab === "low_stock") setLowStockItems(Array.isArray(data) ? data : []);
        else if (activeTab === "valuation") setValuation(data || null);
      } else {
        // API responded but success is false — reset to empty state, don't show error
        if (activeTab === "summary") setMetrics(null);
        else if (activeTab === "movements") setMovements([]);
        else if (activeTab === "low_stock") setLowStockItems([]);
        else if (activeTab === "valuation") setValuation(null);
      }
    } catch (error: any) {
      console.error("Error fetching report data:", error);
      const status = error?.response?.status;
      // Only show error for genuine server/network issues, not for empty data
      if (status === 401) {
        message.error("Session expired. Please log in again.");
      } else if (status && status >= 500) {
        message.error("Server error generating report. Please try again later.");
      }
      // For other errors (404, network), silently show empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, dateRange, aggregatedBy]);

  // --- Renderers ---

  const renderSummary = () => {
    if (!metrics) return <Empty description="No summary data available" />;
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
              {metrics.stockByCategory.length > 0 ? (
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
              ) : (
                <Empty description="No category data" />
              )}
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Top 5 Products by Value">
              {metrics.topProductsByValue.length > 0 ? (
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
              ) : (
                <Empty description="No product data" />
              )}
            </Card>
          </Col>
        </Row>
      </>
    );
  };

  const renderMovements = () => {
    // Group raw movements by date for the chart
    const grouped: Record<string, { in: number; out: number }> = {};
    movements.forEach((m) => {
      const date = dayjs(m.created_at).format("YYYY-MM-DD");
      if (!grouped[date]) grouped[date] = { in: 0, out: 0 };
      if (m.movement_type === "IN") {
        grouped[date].in += Math.abs(m.quantity_change);
      } else {
        grouped[date].out += Math.abs(m.quantity_change);
      }
    });
    const chartData = Object.entries(grouped)
      .map(([date, vals]) => ({ date, ...vals }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return (
      <Card
        title="Stock Movements Over Time"
        extra={
          <Select value={aggregatedBy} onChange={setAggregatedBy} style={{ width: 120 }}>
            <Option value="day">Daily</Option>
            <Option value="week">Weekly</Option>
            <Option value="month">Monthly</Option>
          </Select>
        }
      >
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="in" stroke="#82ca9d" name="Stock In" />
              <Line type="monotone" dataKey="out" stroke="#8884d8" name="Stock Out" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Empty description="No movement data for this period" />
        )}
      </Card>
    );
  };

  const renderLowStock = () => {
    const columns = [
      { title: "Product", dataIndex: "name", key: "name" },
      { title: "Current Stock", dataIndex: "quantity", key: "quantity" },
      {
        title: "Threshold",
        dataIndex: "low_stock_threshold",
        key: "low_stock_threshold",
        render: (val: number | null) => val ?? 10,
      },
      {
        title: "Deficit",
        key: "deficit",
        render: (_: any, record: LowStockProduct) => {
          const threshold = record.low_stock_threshold ?? 10;
          const deficit = threshold - record.quantity;
          return deficit > 0 ? <Text type="danger">{deficit}</Text> : 0;
        },
      },
      {
        title: "Price",
        dataIndex: "price",
        key: "price",
        render: (val: number) => `KES ${Number(val).toLocaleString()}`,
      },
    ];

    return (
      <Card title="Low Stock Report">
        <Table
          dataSource={lowStockItems}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: <Empty description="No low stock items" /> }}
        />
      </Card>
    );
  };

  const renderValuation = () => {
    if (!valuation) return <Empty description="No valuation data available" />;
    return (
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Card>
          <Statistic
            title="Total Inventory Valuation"
            value={valuation.totalValue}
            prefix="KES"
            precision={2}
            valueStyle={{ color: "#3f8600" }}
          />
        </Card>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="Valuation by Category">
              {valuation.byCategory.length > 0 ? (
                <Table
                  dataSource={valuation.byCategory}
                  rowKey="category"
                  pagination={false}
                  columns={[
                    { title: "Category", dataIndex: "category" },
                    { title: "Item Count", dataIndex: "count" },
                    {
                      title: "Value (KES)",
                      dataIndex: "value",
                      render: (val: number) => Number(val).toLocaleString(),
                    },
                  ]}
                />
              ) : (
                <Empty description="No category valuation data" />
              )}
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Valuation History">
              {valuation.history.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={valuation.history}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" name="Total Value" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="No history data available yet" />
              )}
            </Card>
          </Col>
        </Row>
      </Space>
    );
  };

  const exportToCsv = () => {
    let csvContent = "";
    const timestamp = dayjs().format("YYYY-MM-DD");

    if (activeTab === "summary" && metrics) {
      csvContent += "Metric,Value\n";
      csvContent += `Total Products,${metrics.totalProducts}\n`;
      csvContent += `Total Stock Units,${metrics.totalStockUnits}\n`;
      csvContent += `Total Inventory Value (KES),${metrics.totalInventoryValue}\n`;
      csvContent += `Average Price (KES),${metrics.avgPrice}\n`;
      csvContent += `Low Stock Count,${metrics.lowStockCount}\n`;
      csvContent += `Out of Stock Count,${metrics.outOfStockCount}\n`;
      csvContent += `Stock In,${metrics.movementSummary.in}\n`;
      csvContent += `Stock Out,${metrics.movementSummary.out}\n`;
      csvContent += `Net Movement,${metrics.movementSummary.net}\n`;
      csvContent += "\nCategory,Stock Units\n";
      metrics.stockByCategory.forEach(c => {
        csvContent += `"${c.name}",${c.value}\n`;
      });
      csvContent += "\nTop Product,Value (KES)\n";
      metrics.topProductsByValue.forEach(p => {
        csvContent += `"${p.name}",${p.value}\n`;
      });
    } else if (activeTab === "movements" && movements.length > 0) {
      csvContent += "Date,Type,Quantity Change,Stock Before,Stock After,Reason\n";
      movements.forEach(m => {
        csvContent += `${dayjs(m.created_at).format("YYYY-MM-DD HH:mm")},${m.movement_type},${m.quantity_change},${m.stock_before},${m.stock_after},"${m.reason || ""}"\n`;
      });
    } else if (activeTab === "low_stock" && lowStockItems.length > 0) {
      csvContent += "Product,Current Stock,Threshold,Deficit,Price (KES)\n";
      lowStockItems.forEach(item => {
        const threshold = item.low_stock_threshold ?? 10;
        const deficit = Math.max(0, threshold - item.quantity);
        csvContent += `"${item.name}",${item.quantity},${threshold},${deficit},${item.price}\n`;
      });
    } else if (activeTab === "valuation" && valuation) {
      csvContent += `Total Inventory Valuation (KES),${valuation.totalValue}\n\n`;
      csvContent += "Category,Item Count,Value (KES)\n";
      valuation.byCategory.forEach(c => {
        csvContent += `"${c.category}",${c.count},${c.value}\n`;
      });
    } else {
      message.warning("No data to export.");
      return;
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inventory_${activeTab}_report_${timestamp}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    message.success("CSV downloaded successfully.");
  };

  const exportToPdf = () => {
    window.print();
  };

  return (
    <div style={{ padding: 24, paddingBottom: 50 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Inventory Reports</Title>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={exportToCsv}>Export CSV</Button>
          <Button icon={<PrinterOutlined />} onClick={exportToPdf}>Print PDF</Button>
        </Space>
      </div>

      <div style={{ marginBottom: 24, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <RangePicker
          value={dateRange}
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) setDateRange([dates[0], dates[1]]);
          }}
          presets={[
            { label: "Last 7 Days", value: [dayjs().subtract(7, "d"), dayjs()] },
            { label: "Last 30 Days", value: [dayjs().subtract(30, "d"), dayjs()] },
            { label: "This Month", value: [dayjs().startOf("month"), dayjs().endOf("month")] },
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
            children: loading ? <Spin size="large" /> : renderSummary(),
          },
          {
            key: "movements",
            label: "Stock Movements",
            children: loading ? <Spin size="large" /> : renderMovements(),
          },
          {
            key: "low_stock",
            label: <Space><WarningOutlined /> Low Stock</Space>,
            children: loading ? <Spin size="large" /> : renderLowStock(),
          },
          {
            key: "valuation",
            label: <Space><DollarOutlined /> Valuation</Space>,
            children: loading ? <Spin size="large" /> : renderValuation(),
          },
        ]}
      />
    </div>
  );
};

export default InventoryReportsPage;
