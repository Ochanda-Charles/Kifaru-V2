"use client";

import React, { useState, useEffect } from "react";
import { Layout, Menu, Button, message, Typography } from "antd";
import {
    ShopOutlined,
    BarChartOutlined,
    FolderOpenOutlined,
    FileTextOutlined,
    TeamOutlined,
    UserOutlined,
    DollarOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import WalletSetupModal from "../../utilis/WalletSetupModal";
import api from "@/app/utilis/api";

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [collapsed, setCollapsed] = useState(false);
    const [merchantUsername, setMerchantUsername] = useState("User");
    const [merchantId, setMerchantId] = useState<string | null>(null);
    const [walletModalVisible, setWalletModalVisible] = useState(false);

    const pathname = usePathname();

    // Determine selected key based on pathname
    const getSelectedKey = () => {
        if (pathname.includes("/pos")) return "pos";
        if (pathname.includes("/inventory")) return "inventory";
        if (pathname.includes("/categories")) return "categories";
        if (pathname.includes("/reports")) return "reports";
        if (pathname.includes("/suppliers")) return "suppliers";
        return "dashboard";
    };

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

    const handleLogout = () => {
        localStorage.removeItem("merchantToken");
        localStorage.removeItem("your_wallet_address");
        localStorage.removeItem("merchant_id");
        axios.defaults.headers.common["Authorization"] = "";
        window.location.href = "/";
    };

    const handleMenuClick = (e: { key: string }) => {
        if (e.key === "my Wallet") {
            setWalletModalVisible(true);
        }
    };

    return (
        <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
            {/* Sidebar */}
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                theme="light"
                style={{
                    position: "fixed",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
                    zIndex: 1000,
                    borderRight: "1px solid #f0f0f0"
                }}
                width={250}
            >
                <div
                    style={{
                        height: 64,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderBottom: "1px solid #f0f0f0",
                        marginBottom: 20,
                    }}
                >
                    <Title level={4} style={{ margin: 0, color: '#16a34a', fontWeight: 'bold' }}>
                        {collapsed ? 'K' : 'KIFARU SWYPT'}
                    </Title>
                </div>
                <Menu
                    theme="light"
                    selectedKeys={[getSelectedKey()]}
                    mode="inline"
                    onClick={handleMenuClick}
                    style={{ borderRight: 0 }}
                    items={[
                        { key: "pos", icon: <DollarOutlined style={{ color: '#16a34a' }} />, label: <Link href="/merchants/dashboard/pos">POS / New Sale</Link> },
                        { key: "dashboard", icon: <ShopOutlined />, label: <Link href="/merchants/dashboard">Dashboard</Link> },
                        { key: "inventory", icon: <BarChartOutlined />, label: <Link href="/merchants/dashboard/inventory">Inventory</Link> },
                        { key: "categories", icon: <FolderOpenOutlined />, label: <Link href="/merchants/dashboard/categories">Categories</Link> },
                        { key: "reports", icon: <FileTextOutlined />, label: <Link href="/merchants/dashboard/reports">Reports</Link> },
                        { key: "suppliers", icon: <TeamOutlined />, label: <Link href="/merchants/dashboard/suppliers">Suppliers</Link> },
                        { key: "Clients", icon: <UserOutlined />, label: "Clients" },
                        { type: 'divider' },
                        { key: "my Wallet", icon: <DollarOutlined />, label: "My Wallet" },
                    ]}
                />
            </Sider>

            <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: 'all 0.2s' }}>
                {/* Fixed Header */}
                <Header
                    style={{
                        position: "fixed",
                        top: 0,
                        left: collapsed ? 80 : 250,
                        right: 0,
                        zIndex: 100,
                        padding: "0 24px",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                        height: 64,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: `calc(100% - ${collapsed ? 80 : 250}px)`,
                        transition: 'all 0.2s',
                        borderBottom: "1px solid #f0f0f0"
                    }}
                >
                    <Title level={5} style={{ margin: 0, color: "#1f2937" }}>
                        Welcome, <span style={{ color: '#16a34a' }}>{merchantUsername}</span>
                    </Title>

                    <Button
                        onClick={handleLogout}
                        type="text"
                        danger
                        style={{
                            fontWeight: "bold",
                            border: "1px solid #fee2e2",
                            backgroundColor: "#fef2f2"
                        }}
                    >
                        Logout
                    </Button>
                </Header>

                {/* Content Area */}
                <Content
                    style={{
                        marginTop: 64, // Header height
                        margin: "88px 24px 24px",
                        minHeight: 280,
                    }}
                >
                    {children}
                </Content>
            </Layout>

            {/* Wallet Modal (Global) */}
            <WalletSetupModal
                visible={walletModalVisible}
                merchant_id={merchantId || ""}
                onClose={() => setWalletModalVisible(false)}
                onSubmit={(address) => {
                    setWalletModalVisible(false);
                    message.success("Wallet saved successfully!");
                    localStorage.setItem('your_wallet_address', address);
                }}
            />
        </Layout>
    );
}
