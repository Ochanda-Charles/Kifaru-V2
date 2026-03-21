"use client";

import React, { useReducer, useEffect, useRef } from "react";
import {
    Table,
    Tag,
    Card,
    Select,
    Button,
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
    SyncOutlined,
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import api from "@/app/utilis/api";

const { Title, Text } = Typography;

// ── Types ──────────────────────────────────────────────────────────────

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
        paymentMethod?: string;
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

interface SummaryInfo {
    completedCount: number;
    revenue: number;
}

// ── Reducer (single atomic state) ──────────────────────────────────────

interface State {
    transactions: Transaction[];
    pagination: PaginationInfo;
    summary: SummaryInfo;
    tableLoading: boolean;
    initialLoad: boolean;
    statusFilter: string;
    selectedTx: Transaction | null;
    syncing: boolean;
}

type Action =
    | { type: "FETCH_START" }
    | {
        type: "FETCH_SUCCESS";
        transactions: Transaction[];
        pagination: PaginationInfo;
        summary: SummaryInfo;
    }
    | { type: "FETCH_ERROR" }
    | { type: "SET_FILTER"; status: string }
    | { type: "SELECT_TX"; tx: Transaction | null }
    | { type: "SYNC_START" }
    | { type: "SYNC_END" };

const initialState: State = {
    transactions: [],
    pagination: { page: 1, limit: 15, total: 0, totalPages: 0 },
    summary: { completedCount: 0, revenue: 0 },
    tableLoading: true,
    initialLoad: true,
    statusFilter: "ALL",
    selectedTx: null,
    syncing: false,
};

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case "FETCH_START":
            return { ...state, tableLoading: true };
        case "FETCH_SUCCESS":
            return {
                ...state,
                transactions: action.transactions,
                pagination: action.pagination,
                summary: action.summary,
                tableLoading: false,
                initialLoad: false,
            };
        case "FETCH_ERROR":
            return { ...state, tableLoading: false, initialLoad: false };
        case "SET_FILTER":
            return { ...state, statusFilter: action.status };
        case "SELECT_TX":
            return { ...state, selectedTx: action.tx };
        case "SYNC_START":
            return { ...state, syncing: true };
        case "SYNC_END":
            return { ...state, syncing: false };
        default:
            return state;
    }
}

// ── Constants ──────────────────────────────────────────────────────────

const STATUS_CONFIG = {
    COMPLETED: { color: "success", icon: <CheckCircleOutlined />, label: "Completed" },
    PENDING: { color: "warning", icon: <ClockCircleOutlined />, label: "Pending" },
    FAILED: { color: "error", icon: <CloseCircleOutlined />, label: "Failed" },
} as const;

const FILTER_OPTIONS = [
    { value: "ALL", label: "All Statuses" },
    { value: "COMPLETED", label: "Completed" },
    { value: "PENDING", label: "Pending" },
    { value: "FAILED", label: "Failed" },
];

const PAGE_SIZE = 15;

// ── Helpers ────────────────────────────────────────────────────────────

function getCustomerPhone(tx: Transaction): string {
    return (
        tx.customer_details?.phone ||
        tx.payment_metadata?.fonbnk_webhook?.customerPhone ||
        "—"
    );
}

function getPaymentMethod(tx: Transaction): string {
    return (
        tx.payment_metadata?.method ||
        tx.payment_metadata?.paymentMethod ||
        "M-Pesa"
    );
}

function getFonbnkOrderId(tx: Transaction): string | undefined {
    return (
        tx.payment_metadata?.fonbnk_order_id ||
        tx.payment_metadata?.fonbnk_webhook?.orderId
    );
}

function getSummary(transactions: Transaction[]): SummaryInfo {
    return transactions.reduce<SummaryInfo>(
        (acc, tx) => {
            if (tx.status !== "COMPLETED") {
                return acc;
            }

            acc.completedCount += 1;
            const amount = Number(tx.total_amount);
            if (Number.isFinite(amount)) {
                acc.revenue += amount;
            }

            return acc;
        },
        { completedCount: 0, revenue: 0 },
    );
}

// ── Detail-row sub-component ───────────────────────────────────────────

const DetailRow = React.memo(
    ({ label, value, copyable }: { label: string; value: React.ReactNode; copyable?: boolean }) => (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Text type="secondary" style={{ fontSize: 13 }}>{label}</Text>
            {typeof value === "string" && copyable ? (
                <Text copyable style={{ fontSize: 13, fontWeight: 500 }}>{value}</Text>
            ) : (
                <Text style={{ fontSize: 13, fontWeight: 500 }}>{value}</Text>
            )}
        </div>
    ),
);
DetailRow.displayName = "DetailRow";

// ── Summary cards sub-component (isolated from table loading) ──────────

const SummaryCards = React.memo(
    ({ total, completedCount, revenue }: { total: number; completedCount: number; revenue: number }) => (
        <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={8}>
                <Card size="small" style={{ borderRadius: 12 }}>
                    <Statistic
                        title="Total Transactions"
                        value={total}
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
                        value={revenue}
                        precision={2}
                        prefix="KES"
                        valueStyle={{ color: "#16a34a" }}
                    />
                </Card>
            </Col>
        </Row>
    ),
);
SummaryCards.displayName = "SummaryCards";

// ── Page component ─────────────────────────────────────────────────────

const TransactionsPage = () => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const abortRef = useRef<AbortController | null>(null);
    const requestIdRef = useRef(0);

    const fetchTransactions = async (page: number, status: string) => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        const requestId = ++requestIdRef.current;

        dispatch({ type: "FETCH_START" });

        try {
            const params: Record<string, string | number> = { page, limit: PAGE_SIZE };
            if (status !== "ALL") params.status = status;

            const res = await api.get("/inventory/transactions", {
                params,
                signal: controller.signal,
            });

            if (requestId !== requestIdRef.current || controller.signal.aborted) return;

            if (res.data.success) {
                const transactions: Transaction[] = Array.isArray(res.data.data) ? res.data.data : [];
                const pagination: PaginationInfo = res.data.pagination ?? {
                    page,
                    limit: PAGE_SIZE,
                    total: 0,
                    totalPages: 0,
                };

                dispatch({
                    type: "FETCH_SUCCESS",
                    transactions,
                    pagination,
                    summary: getSummary(transactions),
                });
            } else {
                message.error(res.data.error || "Failed to load transactions.");
                dispatch({ type: "FETCH_ERROR" });
            }
        } catch (err: any) {
            if (err?.code === "ERR_CANCELED") return;
            if (requestId !== requestIdRef.current || controller.signal.aborted) return;
            console.error("Error fetching transactions:", err);
            const status = err?.response?.status;
            const errMsg = err?.response?.data?.error;
            if (status === 401) {
                message.error("Session expired. Please log in again.");
            } else if (errMsg) {
                message.error(errMsg);
            } else {
                message.error("Failed to load transactions.");
            }
            dispatch({ type: "FETCH_ERROR" });
        }
    };

    const syncFonbnkOrders = async () => {
        dispatch({ type: "SYNC_START" });
        try {
            const res = await api.get("/fonbnk/sync-orders");
            if (res.data.success) {
                const d = res.data.data;
                if (d?.created > 0) {
                    message.success(`Synced ${d.created} new transaction(s) from Fonbnk`);
                    return true;
                }
                if (d?.total === 0) {
                    message.info("No orders found in Fonbnk");
                } else if (d?.skipped > 0 || d?.unmatched > 0) {
                    message.info(`Fonbnk: ${d.total} orders found, ${d.skipped} already synced, ${d.unmatched || 0} unmatched wallet`);
                }
            } else {
                message.warning(res.data.error || "Sync returned no data");
            }
        } catch (err: any) {
            const errMsg = err?.response?.data?.error || err.message;
            message.error(`Fonbnk sync failed: ${errMsg}`);
            console.error("Fonbnk sync error:", errMsg);
        } finally {
            dispatch({ type: "SYNC_END" });
        }
        return false;
    };

    useEffect(() => {
        // Sync Fonbnk orders first, then fetch transactions
        syncFonbnkOrders().then((hadNew) => {
            fetchTransactions(1, "ALL");
        });

        return () => {
            abortRef.current?.abort();
        };
    }, []);

    // ── Derived values ─────────────────────────────────────────────────
    const { transactions, pagination, summary, tableLoading, statusFilter, selectedTx, syncing } = state;

    // ── Handlers ───────────────────────────────────────────────────────

    const handleFilterChange = (val: string) => {
        dispatch({ type: "SET_FILTER", status: val });
        fetchTransactions(1, val);
    };

    const handleTableChange = (pag: TablePaginationConfig) => {
        fetchTransactions(pag.current || 1, statusFilter);
    };

    // ── Table columns ──────────────────────────────────────────────────

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
            render: (status: keyof typeof STATUS_CONFIG) => {
                const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
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
                const orderId = getFonbnkOrderId(record);
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
                        onClick={() => dispatch({ type: "SELECT_TX", tx: record })}
                    />
                </Tooltip>
            ),
        },
    ];

    // ── Render ──────────────────────────────────────────────────────────

    return (
        <div>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>Transaction Log</Title>
                    <Text type="secondary">All payment transactions from your store</Text>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Button
                        icon={<SyncOutlined spin={syncing} />}
                        loading={syncing}
                        onClick={async () => {
                            const hadNew = await syncFonbnkOrders();
                            if (hadNew) fetchTransactions(pagination.page, statusFilter);
                        }}
                    >
                        Sync Fonbnk
                    </Button>
                    <Select
                        value={statusFilter}
                        onChange={handleFilterChange}
                        style={{ width: 160 }}
                        options={FILTER_OPTIONS}
                    />
                </div>
            </div>

            {/* Summary cards — isolated component, only re-renders when props change */}
            <SummaryCards
                total={pagination.total}
                completedCount={summary.completedCount}
                revenue={summary.revenue}
            />

            {/* Table */}
            <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: 0 }}>
                <Table
                    columns={columns}
                    dataSource={transactions}
                    rowKey="id"
                    loading={tableLoading}
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
                onCancel={() => dispatch({ type: "SELECT_TX", tx: null })}
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
                                    color={STATUS_CONFIG[selectedTx.status]?.color}
                                    icon={STATUS_CONFIG[selectedTx.status]?.icon}
                                >
                                    {STATUS_CONFIG[selectedTx.status]?.label}
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

export default TransactionsPage;
