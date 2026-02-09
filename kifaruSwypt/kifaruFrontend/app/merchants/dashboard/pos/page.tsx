"use client";

import React, { useState, useEffect } from 'react';
import {
    Layout,
    Card,
    Input,
    Button,
    List,
    Typography,
    Row,
    Col,
    Avatar,
    Badge,
    Divider,
    message,
    Empty
} from 'antd';
import {
    SearchOutlined,
    PlusOutlined,
    MinusOutlined,
    DeleteOutlined,
    ShoppingCartOutlined,
    ScanOutlined
} from '@ant-design/icons';
import api from '@/app/utilis/api';
import { DepositModal } from 'swypt-checkout';
import 'swypt-checkout/dist/styles.css';

const { Content } = Layout;
const { Title, Text } = Typography;

interface Product {
    id: string | number;
    name: string;
    price: number;
    imageUrl: string;
    quantity: number; // Stock available
}

interface CartItem {
    product: Product;
    quantity: number; // Cart quantity
}

const MerchantPOS = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [merchantAddress, setMerchantAddress] = useState<string | null>(null);

    // Modal state
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

    useEffect(() => {
        fetchProductsAndWallet();
    }, []);

    const fetchProductsAndWallet = async () => {
        setLoading(true);
        try {
            const merchant_id = localStorage.getItem('merchant_id');
            if (!merchant_id) {
                message.error("Merchant ID not found. Please login again.");
                return;
            }

            // 1. Fetch Products
            const productsRes = await api.get(`/getMerchantProducts/${merchant_id}`);
            const fetchedProducts = (productsRes.data.data || []).map((p: any) => ({
                ...p,
                imageUrl: p.imageUrl || p.imageurl || '', // Handle different casing
                price: Number(p.price), // Ensure price is a number
                quantity: Number(p.quantity) // Ensure quantity is a number
            }));
            setProducts(fetchedProducts);
            setFilteredProducts(fetchedProducts);

            // 2. Fetch Wallet
            const walletRes = await api.get(`/getWallet/${merchant_id}`);
            if (walletRes.data?.wallet_address) {
                setMerchantAddress(walletRes.data.wallet_address);
            } else {
                message.warning("Please verify your wallet address in settings before accepting payments.");
            }

        } catch (error) {
            console.error("Error loading POS data:", error);
            message.error("Failed to load products or wallet info.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toLowerCase();
        setSearchTerm(value);
        const filtered = products.filter(p =>
            p.name.toLowerCase().includes(value)
        );
        setFilteredProducts(filtered);
    };

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const updateQuantity = (productId: string | number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) {
                const newQty = Math.max(0, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const removeItem = (productId: string | number) => {
        setCart(prev => prev.filter(item => item.product.id !== productId));
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);
    };

    const handleCheckout = () => {
        if (cart.length === 0) {
            message.warning("Cart is empty!");
            return;
        }
        if (!merchantAddress) {
            message.error("Merchant wallet address is missing. Cannot process payment.");
            return;
        }
        setIsDepositModalOpen(true);
    };

    const handlePaymentSuccess = async () => {
        try {
            console.log("Payment successful, syncing inventory...");
            const merchant_id = localStorage.getItem('merchant_id');

            // Call backend to record transaction and update stock
            await api.post("/inventory/checkout", {
                items: cart.map(item => ({
                    product_id: item.product.id,
                    quantity: item.quantity,
                    price: item.product.price
                })),
                totalAmount: calculateTotal(),
                merchant_id,
                paymentMethod: 'crypto',
                reference: `POS-${Date.now()}`
            });

            message.success("Sale completed successfully! Inventory updated.");
            setCart([]);
            setIsDepositModalOpen(false);

            // Refresh products to show new stock levels
            fetchProductsAndWallet();

        } catch (error) {
            console.error("Inventory sync failed:", error);
            message.error("Payment received but inventory update failed. Please check logs.");
        }
    };

    return (
        <Content style={{ padding: '24px', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
            <Row gutter={24} style={{ height: '100%' }}>

                {/* LEFT: Product List */}
                <Col span={16} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Card
                        title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <Title level={4} style={{ margin: 0 }}>Products</Title>
                                <Input
                                    placeholder="Search products..."
                                    prefix={<SearchOutlined />}
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    style={{ width: 300 }}
                                />
                            </div>
                        }
                        style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                        bodyStyle={{ flex: 1, overflowY: 'auto' }}
                    >
                        <List
                            grid={{ gutter: 16, column: 3 }}
                            dataSource={filteredProducts}
                            loading={loading}
                            renderItem={(item) => (
                                <List.Item>
                                    <Card
                                        hoverable
                                        cover={
                                            <div
                                                style={{
                                                    height: 140,
                                                    backgroundImage: `url(${item.imageUrl})`,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center'
                                                }}
                                            />
                                        }
                                        onClick={() => addToCart(item)}
                                        bodyStyle={{ padding: 12 }}
                                    >
                                        <Card.Meta
                                            title={
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: 14 }}>{item.name}</span>
                                                    <span style={{ color: '#16a34a', fontWeight: 'bold' }}>
                                                        {Number(item.price).toLocaleString()}
                                                    </span>
                                                </div>
                                            }
                                            description={
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    Stock: {item.quantity}
                                                </Text>
                                            }
                                        />
                                    </Card>
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>

                {/* RIGHT: Cart / Checkout */}
                <Col span={8} style={{ height: '100%' }}>
                    <Card
                        title={<Title level={4} style={{ margin: 0 }}><ShoppingCartOutlined /> Current Sale</Title>}
                        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                        bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                    >
                        {/* Cart Items List */}
                        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16 }}>
                            {cart.length === 0 ? (
                                <Empty description="No items in cart" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                            ) : (
                                <List
                                    itemLayout="horizontal"
                                    dataSource={cart}
                                    renderItem={(item) => (
                                        <List.Item actions={[
                                            <Button key="minus" size="small" icon={<MinusOutlined />} onClick={() => updateQuantity(item.product.id, -1)} />,
                                            <Text key="qty">{item.quantity}</Text>,
                                            <Button key="plus" size="small" icon={<PlusOutlined />} onClick={() => updateQuantity(item.product.id, 1)} />,
                                            <Button key="del" size="small" danger icon={<DeleteOutlined />} onClick={() => removeItem(item.product.id)} />
                                        ]}>
                                            <List.Item.Meta
                                                avatar={<Avatar src={item.product.imageUrl} shape="square" size="large" />}
                                                title={item.product.name}
                                                description={`@ ${Number(item.product.price).toLocaleString()}`}
                                            />
                                            <div style={{ fontWeight: 'bold' }}>
                                                {(Number(item.product.price) * item.quantity).toLocaleString()}
                                            </div>
                                        </List.Item>
                                    )}
                                />
                            )}
                        </div>

                        {/* Total & Checkout Section */}
                        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                <Title level={4}>Total:</Title>
                                <Title level={3} type="success">KES {calculateTotal().toLocaleString()}</Title>
                            </div>

                            <Button
                                type="primary"
                                size="large"
                                block
                                icon={<ScanOutlined />}
                                style={{ height: 50, fontSize: 18, backgroundColor: '#16a34a' }}
                                onClick={handleCheckout}
                                disabled={cart.length === 0}
                            >
                                Charge Customer
                            </Button>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Swypt Payment Modal */}
            {isDepositModalOpen && merchantAddress && (
                <div style={{ position: 'fixed', zIndex: 1000, inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={() => setIsDepositModalOpen(false)} />
                    <div style={{ position: 'relative', zIndex: 1010 }}>
                        <DepositModal
                            isOpen={isDepositModalOpen}
                            onClose={() => setIsDepositModalOpen(false)}
                            headerBackgroundColor="#000"
                            businessName="Kifaru POS"
                            merchantName="Store Checkout"
                            merchantAddress={merchantAddress}
                            amount={calculateTotal()}
                            // @ts-ignore
                            onSuccess={handlePaymentSuccess}
                        />
                    </div>
                </div>
            )}

        </Content>
    );
};

export default MerchantPOS;
