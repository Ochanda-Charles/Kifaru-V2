"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Table,
    Tag,
    Card,
    Select,
    Typography,
    message,
    Statistic,
    Row,
    Col,
    Tooltip,
    Empty,
    Modal,
} from "antd";
import {
    DollarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    InfoCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import api from "@/app/utilis/api";

const { Title, Text } = Typography;

interface Transaction {
    id: string;
    merchant_id: string;
    total_amount: string;
    currency: string;
    status: "PENDING" | "COMPLETED" | "FAILED";
    customer_details: {
        phone?: string;
        [key: string]: any;
    };
    payment_metadata: {
        method?: string;
        fonbnk_order_id?: string;
        fonbnk_webhook?: {
            orderId?: string;
            status?: string;
            cryptoAmount?: string;
            localCurrencyAmount?: string;
            network?: string;
            asset?: string;
            customerPhone?: string;
            carrier?: string;
            received_at?: string;
        };
        [key: string]: any;
    };
    created_at: string;
}

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const statusConfig = {
    COMPLETED: { color: "success", icon: <CheckCircleOutlined />, label: "Completed" },
    PENDING: { color: "warning", icon: <ClockCircleOutlined />, label: "Pending" },
    FAILED: { color: "error", icon: <CloseCircleOutlined />, label: "Failed" },
};

const TransactionsPage = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 15,
        total: 0,
        totalPages: 0,
    });
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const hasFetched = useRef(false);

    const fetchTransactions = async (page = 1, status = "ALL") => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = { page, limit: 15 };
            if (status !== "ALL") params.status = status;

            const res = await api.get("/inventory/transactions", { params });

            if (res.data.success) {
                setTransactions(res.data.data);
                setPagination(res.data.pagination);
            } else {
                message.error(res.data.error || "Failed to load transactions");
            }
        } catch (err: any) {
            console.error("Error fetching transactions:", err);
            message.error("Failed to load transactions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (hasFetched.current && statusFilter === "ALL") return;
        hasFetched.current = true;
        fetchTransactions(1, statusFilter);
    }, [statusFilter]);

    const handleTableChange = (pag: TablePaginationConfig) => {
        fetchTransactions(pag.current || 1, statusFilter);
    };

    // Derive summary stats from pagination totals
    const completedCount = transactions.filter(t => t.status === "COMPLETED").length;
    const totalRevenue = transactions
        .filter(t => t.status === "COMPLETED")
        .reduce((sum, t) => sum + parseFloat(t.total_amount), 0);

    const getCustomerPhone = (tx: Transaction): string => {
        return tx.customer_details?.phone
            || tx.payment_metadata?.fonbnk_webhook?.customerPhone
            || "—";
    };

    const getPaymentMethod = (tx: Transaction): string => {
        return tx.payment_metadata?.method
            || tx.payment_metadata?.paymentMethod
            || "M-Pesa";
    };

    const columns: ColumnsType<Transaction> = [
        {
            title: "Date",
            dataIndex: "created_at",
            key: "date",
            width: 180,
            render: (date: string) => {
                const d = new Date(date);
                return (
                    <div>
                        <Text strong style={{ fontSize: 13 }}>
                            {d.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                        </Text>
                    </div>
                );
            },
        },
        {
            title: "Amount",
            dataIndex: "total_amount",
            key: "amount",
            width: 140,
            render: (amount: string, record: Transaction) => (
                <Text strong style={{ fontSize: 15, color: "#16a34a" }}>
                    {record.currency} {parseFloat(amount).toLocaleString()}
                </Text>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 130,
            render: (status: keyof typeof statusConfig) => {
                const config = statusConfig[status] || statusConfig.PENDING;
                return (
                    <Tag
                        color={config.color}
                        icon={config.icon}
                        style={{ borderRadius: 12, fontWeight: 600, padding: "2px 10px" }}
                    >
                        {config.label}
                    </Tag>
                );
            },
        },
        {
            title: "Customer Phone",
            key: "phone",
            width: 160,
            render: (_: any, record: Transaction) => (
                <Text style={{ fontSize: 13 }}>{getCustomerPhone(record)}</Text>
            ),
        },
        {
            title: "Payment",
            key: "method",
            width: 120,
            render: (_: any, record: Transaction) => (
                <Tag style={{ borderRadius: 8 }}>{getPaymentMethod(record)}</Tag>
            ),
        },
        {
            title: "Fonbnk Order",
            key: "fonbnk",
            width: 140,
            render: (_: any, record: Transaction) => {
                const orderId = record.payment_metadata?.fonbnk_order_id
                    || record.payment_metadata?.fonbnk_webhook?.orderId;
                return orderId ? (
                    <Tooltip title={orderId}>
                        <Text copyable={{ text: orderId }} style={{ fontSize: 12 }}>
                            {orderId.substring(0, 12)}...
                        </Text>
                    </Tooltip>
                ) : (
                    <Text type="secondary">—</Text>
                );
            },
        },
        {
            title: "",
            key: "actions",
            width: 50,
            render: (_: any, record: Transaction) => (
                <Tooltip title="View details">
                    <InfoCircleOutlined
                        style={{ cursor: "pointer", color: "#16a34a", fontSize: 16 }}
                        onClick={() => setSelectedTx(record)}
                    />
                </Tooltip>
            ),
        },
    ];

    return (
        <div>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>Transaction Log</Title>
                    <Text type="secondary">All payment transactions from your store</Text>
                </div>
                <Select
                    value={statusFilter}
                    onChange={(val) => setStatusFilter(val)}
                    style={{ width: 160 }}
                    options={[
                        { value: "ALL", label: "All Statuses" },
                        { value: "COMPLETED", label: "Completed" },
                        { value: "PENDING", label: "Pending" },
                        { value: "FAILED", label: "Failed" },
                    ]}
                />
            </div>

            {/* Summary cards */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={8}>
                    <Card size="small" style={{ borderRadius: 12 }}>
                        <Statistic
                            title="Total Transactions"
                            value={pagination.total}
                            prefix={<DollarOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card size="small" style={{ borderRadius: 12 }}>
                        <Statistic
                            title="Completed (this page)"
                            value={completedCount}
                            prefix={<CheckCircleOutlined style={{ color: "#16a34a" }} />}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card size="small" style={{ borderRadius: 12 }}>
                        <Statistic
                            title="Revenue (this page)"
                            value={totalRevenue}
                            precision={2}
                            prefix="KES"
                            valueStyle={{ color: "#16a34a" }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Table */}
            <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: 0 }}>
                <Table
                    columns={columns}
                    dataSource={transactions}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: pagination.page,
                        pageSize: pagination.limit,
                        total: pagination.total,
                        showSizeChanger: false,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} transactions`,
                    }}
                    onChange={handleTableChange}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={
                                    <span>
                                        No transactions yet.
                                        <br />
                                        Transactions will appear here after customers make payments.
                                    </span>
                                }
                            />
                        ),
                    }}
                    scroll={{ x: 900 }}
                />
            </Card>

            {/* Detail modal */}
            <Modal
                title="Transaction Details"
                open={!!selectedTx}
                onCancel={() => setSelectedTx(null)}
                footer={null}
                width={520}
            >
                {selectedTx && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <DetailRow label="Transaction ID" value={selectedTx.id} copyable />
                        <DetailRow
                            label="Amount"
                            value={`${selectedTx.currency} ${parseFloat(selectedTx.total_amount).toLocaleString()}`}
                        />
                        <DetailRow
                            label="Status"
                            value={
                                <Tag
                                    color={statusConfig[selectedTx.status]?.color}
                                    icon={statusConfig[selectedTx.status]?.icon}
                                >
                                    {statusConfig[selectedTx.status]?.label}
                                </Tag>
                            }
                        />
                        <DetailRow label="Customer Phone" value={getCustomerPhone(selectedTx)} />
                        <DetailRow label="Payment Method" value={getPaymentMethod(selectedTx)} />
                        <DetailRow
                            label="Date"
                            value={new Date(selectedTx.created_at).toLocaleString("en-KE")}
                        />
                        {selectedTx.payment_metadata?.fonbnk_webhook && (
                            <>
                                <div style={{ borderTop: "1px solid #f0f0f0", margin: "8px 0" }} />
                                <Text strong style={{ fontSize: 13, color: "#666" }}>Fonbnk Payment Details</Text>
                                <DetailRow
                                    label="Fonbnk Order ID"
                                    value={selectedTx.payment_metadata.fonbnk_webhook.orderId || "—"}
                                    copyable
                                />
                                <DetailRow
                                    label="Crypto Amount"
                                    value={
                                        selectedTx.payment_metadata.fonbnk_webhook.cryptoAmount
                                            ? `${selectedTx.payment_metadata.fonbnk_webhook.cryptoAmount} ${selectedTx.payment_metadata.fonbnk_webhook.asset || "USDT"}`
                                            : "—"
                                    }
                                />
                                <DetailRow
                                    label="Network"
                                    value={selectedTx.payment_metadata.fonbnk_webhook.network || "—"}
                                />
                                <DetailRow
                                    label="Carrier"
                                    value={selectedTx.payment_metadata.fonbnk_webhook.carrier || "—"}
                                />
                                <DetailRow
                                    label="Webhook Received"
                                    value={
                                        selectedTx.payment_metadata.fonbnk_webhook.received_at
                                            ? new Date(selectedTx.payment_metadata.fonbnk_webhook.received_at).toLocaleString("en-KE")
                                            : "—"
                                    }
                                />
                            </>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

// Helper component for detail rows
const DetailRow = ({
    label,
    value,
    copyable,
}: {
    label: string;
    value: React.ReactNode;
    copyable?: boolean;
}) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Text type="secondary" style={{ fontSize: 13 }}>{label}</Text>
        {typeof value === "string" && copyable ? (
            <Text copyable style={{ fontSize: 13, fontWeight: 500 }}>{value}</Text>
        ) : (
            <Text style={{ fontSize: 13, fontWeight: 500 }}>{value}</Text>
        )}
    </div>
);

export default TransactionsPage;
