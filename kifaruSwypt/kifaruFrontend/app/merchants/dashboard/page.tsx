
"use client";

import React, { use, useEffect, useState } from "react";
import axios from "axios";
import api from "@/app/utilis/api";
import { jwtDecode } from "jwt-decode";
import {
  Layout,
  Menu,
  Button,
  Modal,
  Input,
  InputNumber,
  Upload,
  Table,
  message,
  Row,
  Col,
  Typography,
  Form,
} from "antd";
import {
  UploadOutlined,
  UserOutlined,
  DollarOutlined,
  ShopOutlined,
  CopyOutlined,
  BarChartOutlined,
  FolderOpenOutlined,
  TeamOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import Link from "next/link";

import WalletSetupModal from "../../utilis/WalletSetupModal";
import WalletAddressWithCopy from "../../utilis/walletCopy";
import { log } from "console";
const { Header, Content, Sider } = Layout;
const { Title } = Typography;

type Product = {
  id: number | string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
};

const MerchantDashboard: React.FC = () => {
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [savedWalletAddress, setSavedWalletAddress] = useState("");
  const [merchantusername, setMerchantUsername] = useState("User");
  const [merchant_id, setMerchantId] = useState("0 merchant_id");

  const [collapsed, setCollapsed] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({
    name: "",
    price: 0,
    quantity: 0,
    imageFile: null as File | null,
    imagePreview: "",
  });

  const [antForm] = Form.useForm();

  const fetchWalletAddress = async () => {
    const token = localStorage.getItem('token');

    try {
      const response = await api.get(`/getWallet/${merchant_id}`);

      const address = response.data.wallet_address;
      console.log('Fetched address:', address);

      if (address && address.trim() !== '') {
        setSavedWalletAddress(address);
        localStorage.setItem('your_wallet_address', address);
      } else {
        message.info('No wallet address found. Please save one first.');
        handleMenuClick({ key: 'my Wallet' });
      }
    } catch (error) {
      console.error('Error fetching wallet address:', error);
      message.error('Failed to fetch wallet address.');
    }
  }

    ;
  const handleMenuClick = (e: any) => {
    console.log('Menu clicked:', e.key);

    if (e.key === "my Wallet") {
      setWalletModalVisible(true);
    }
  };

  const resetForm = () => {
    setForm({ name: "", price: 0, quantity: 0, imageFile: null, imagePreview: "" });
  };

  const handleAddClick = () => {
    resetForm();
    setModalVisible(true);
  };

  useEffect(() => {
    const fetchmyProducts = async () => {

      try {
        const id = localStorage.getItem('merchant_id')
        const response = await api.get(`/getMerchantProducts/${id}`);

        setProducts(response.data.data);
      } catch (error) {
        console.error("Error fetching products:", error);
        message.error("Failed to load products.");
      }
    };

    fetchmyProducts();
  }, []);



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const isValidEthereumAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
  };

  const handlePriceChange = (value: number | null) => {
    setForm((prev) => ({ ...prev, price: value ?? 0 }));
  };

  const handleStockChange = (value: number | null) => {
    setForm((prev) => ({ ...prev, quantity: value ?? 0 }));
  };

  const handleImageChange = (info: any) => {
    if (info.file.status === "removed") {
      setForm((prev) => ({ ...prev, imageFile: null, imagePreview: "" }));
      return;
    }
    if (info.file.originFileObj) {
      const file = info.file.originFileObj;
      const preview = URL.createObjectURL(file);
      setForm((prev) => ({ ...prev, imageFile: file, imagePreview: preview }));
    }
  };

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("You can only upload image files!");
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("Image must be smaller than 2MB!");
    }
    return isImage && isLt2M;
  };

  const handleOk = async () => {
    const walletAddressed = localStorage.getItem("your_wallet_address");

    if (!walletAddressed || walletAddressed.trim() === "") {
      message.warning("You must save your wallet address before adding a product.");
      setModalVisible(false)
      handleMenuClick({ key: 'my Wallet' });
      return;
    }
    const { name, price, quantity, imageFile } = form;

    const errors = [];
    if (!name.trim()) errors.push("Product name is required.");
    if (price <= 0) errors.push("Price must be greater than 0.");
    if (quantity <= 0) errors.push("Quantity must be greater than 0.");
    if (!imageFile) errors.push("Product image is required.");
    if (!walletAddressed) errors.push("Wallet address is required.");

    if (errors.length > 0) {
      message.error(errors.join(" "));
      return;
    }

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
      const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY; // Add API key

      if (!cloudName || !uploadPreset || !apiKey) {
        throw new Error("Cloudinary configuration is missing. Check environment variables.");
      }

      // Step 1: Upload to Cloudinary
      const uploadData = new FormData();
      uploadData.append("file", imageFile);
      uploadData.append("upload_preset", uploadPreset);
      uploadData.append("api_key", apiKey); // Required for unsigned uploads

      console.log("Env vars:", {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
        apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
      });
      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: uploadData,
        }
      );

      if (!cloudinaryRes.ok) {
        const errorData = await cloudinaryRes.json();
        throw new Error(`Cloudinary upload failed: ${errorData.error?.message || cloudinaryRes.statusText}`);
      }

      const result = await cloudinaryRes.json();
      const imageUrl = result.secure_url;
      console.log("Cloudinary response:", result);
      console.log("Image URL:", imageUrl);

      // Step 2: Send product info with imageUrl to  backend
      const productPayload = {
        merchant_id,
        name,
        price,
        quantity,
        imageUrl,
        walletAddressed
      };

      const response = await api.post("/AddProduct", productPayload);

      message.success("Product added successfully!");
      console.log("Server response:", response.data);
      setModalVisible(false);
      setForm({
        name: "",
        price: 0,
        quantity: 0,
        imageFile: null,
        imagePreview: "",
      });
      fetchmyProducts();
    } catch (err) {
      if (err?.response) {
        message.error(`Server error: ${err.response.data.message || "Unknown error"}`);
      } else {
        message.error(`Failed to add product: ${err.message || "Check the network or console."}`);
      }
      console.error("POST error:", err);
    }
  };

  const fetchmyProducts = async () => {

    try {
      const id = localStorage.getItem('merchant_id')
      const response = await api.get(`/getMerchantProducts/${id}`);

      setProducts(response.data.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      message.error("Failed to load products.");
    }
  };

  // const handleDelete = (id: number) => {
  //   if (confirm("Delete this product?")) {
  //     setProducts((prev) => prev.filter((p) => p.id !== id));
  //   }
  // };

  const handleDelete = async (id: number | string) => {
    if (!confirm("Delete this product?")) return;

    try {
      await api.delete(`/deleteProduct/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      message.success("Product deleted successfully.");
    } catch (error) {
      console.error("Failed to delete product:", error);
      message.error("Failed to delete product.");
    }
  };


  //  const handleEdit = (id: number) => {
  //   if (confirm("Edit this product?")) {
  //     setProducts((prev) => prev.filter((p) => p.id !== id));
  //   }
  // };


  const handleEdit = (id: number | string) => {
    if (confirm('Edit this product?')) {
      const product = products.find((p) => p.id === id);
      if (!product) {
        message.error('Product not found');
        return;
      }
      // setEditingProduct(product);
      setForm({
        name: product.name,
        price: product.price,
        quantity: product.quantity,
        imageFile: null,
        imagePreview: product.imageUrl,
      });
      antForm.setFieldsValue({
        id: product.id,
        name: product.name,
        // description: product.description,
        price: product.price,
        // category: product.category,
        quantity: product.quantity,
        imageUrl: product.imageUrl,
      });
      setModalVisible(true);
    }
  };


  const columns = [
    {
      title: "Image",
      dataIndex: "imageurl",
      key: "imageurl",
      render: (url: string) => (
        <img src={url} alt="product" style={{ height: 50, borderRadius: 6 }} />
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      // render: (price: number) => `$${price.toFixed(2)}`,
      render: (price: any) => {
        const num = Number(price);
        return isNaN(num) ? "$0.00" : `$${num.toFixed(2)}`;
      }

    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Product) => (
        <Button type="primary" onClick={() => handleEdit(record.id)}>
          Edit
        </Button>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Product) => (
        <Button danger onClick={() => handleDelete(record.id)}>
          Delete
        </Button>
      ),
    },

  ];


  useEffect(() => {
    const token = localStorage.getItem("merchantToken");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      try {
        const decoded: any = jwtDecode(token);
        const user = decoded.merchantUserName || decoded.merchantusername || decoded.sub || "User";
        const merchant_id = decoded.merchant_id || decoded.merchant_id || decoded.sub || "Unknown merchant_id";
        setMerchantUsername(user);
        setMerchantId(merchant_id);
        console.log("Merchant ID:", merchant_id);
        console.log("Decoded user:", user);
      } catch (error) {
        console.error("Token decode error:", error);
      }
    }
  }, []);

  // Handle card clicks
  const handleCardClick = async (key: string) => {
    console.log('Menu clicked with key:', key);

    if (key === 'view-wallet') {
      console.log('Wallet menu clicked');

      try {
        const response = await api.get(`/getWallet/${merchant_id}`);

        const address = response.data.wallet_address;
        console.log('Fetched address:', address);

        if (address && address.trim() !== '') {
          setSavedWalletAddress(address);
          localStorage.setItem('your_wallet_address', address);
        } else {
          message.info('No wallet address found. Please save one first.');
          handleMenuClick({ key: 'my Wallet' });
        }

      } catch (error: any) {
        console.error('Error fetching wallet address:', error);

        // Axios error handling:
        const status = error.response?.status;
        const msg = error.response?.data?.message;

        if (status === 404 && msg === 'Wallet not found') {
          message.info('No wallet address found. Please save one first.');
          handleMenuClick({ key: 'my Wallet' });
        } else {
          message.error('Error fetching wallet address');
        }
      }
    }

  };



  return (
    <Layout
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to right, #D8B4FE, #C084FC, #A78BFA)",

      }}
    >
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark" style={{ position: "fixed", left: 20, top: 90, bottom: 20, borderRadius: 8, boxShadow: "0 2px 6px rgba(0,0,0,0.5)" }}>

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
        >
          {/* Merchant */}
        </div>
        <Menu
          theme="dark"
          defaultSelectedKeys={["dashboard"]}
          mode="inline"
          onClick={handleMenuClick}
          className="spaced-menu"
          items={[
            { key: "dashboard", icon: <ShopOutlined />, label: "Dashboard" },
            { key: "inventory", icon: <BarChartOutlined />, label: <Link href="/merchants/dashboard/inventory">Inventory</Link> },
            { key: "categories", icon: <FolderOpenOutlined />, label: <Link href="/merchants/dashboard/categories">Categories</Link> },
            { key: "reports", icon: <FileTextOutlined />, label: <Link href="/merchants/dashboard/reports">Reports</Link> },
            { key: "suppliers", icon: <TeamOutlined />, label: <Link href="/merchants/dashboard/suppliers">Suppliers</Link> },
            { key: "Clients", icon: <UserOutlined />, label: "Clients" },
            { key: "my Wallet", icon: <DollarOutlined />, label: "My Wallet" },
          ]}
        />

      </Sider>

      <Layout>
        {/* Fixed Navbar */}
        <Header
          style={{
            position: "fixed",
            top: 10,
            left: 10,
            right: 10,
            zIndex: 100,
            paddingLeft: 24,
            padding: 24,
            backgroundColor: "#111827", // Tailwind gray-900
            boxShadow: "0 2px 6px rgba(0,0,0,0.6)",
            height: 64,
            display: "flex",
            marginBottom: 20,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Title level={4} style={{ color: "white", margin: 30, userSelect: "none" }}>
            Welcome, {merchantusername}
          </Title>

          <button
            onClick={() => {
              localStorage.removeItem("merchantToken");
              localStorage.removeItem("your_wallet_address");
              localStorage.removeItem("merchant_id")
              axios.defaults.headers.common["Authorization"] = "";
              window.location.href = "/";
            }}
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


        {/* Below navbar: cards + add button row */}
        <Content
          style={{
            marginTop: 130,
            marginLeft: 250,
            marginRight: 24,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,
              marginBottom: 24,
              userSelect: "none",
            }}
          >
            {/* Left: Cards */}
            <div style={{ display: "flex", gap: 34, minWidth: 700 }}>
              {[
                { title: "View Transactions", icon: <DollarOutlined /> },
                { title: "View Orders", icon: <ShopOutlined /> },
                { key: "view-wallet", title: "View Wallet Address", icon: <UserOutlined /> },
              ].map((card) => (
                <div
                  key={card.key || card.title}
                  onClick={() => handleCardClick(card.key)}
                  className="shadow-lg rounded-lg p-6 bg-white/10 backdrop-blur-md border border-white/20 cursor-pointer hover:bg-green-700 transition-colors flex items-center space-x-4"
                  style={{ color: "black", flex: "0 0 250px", height: 150, }}
                >

                  <div
                    style={{
                      fontSize: 28,
                      color: "limegreen",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {card.icon}
                  </div>
                  <div className="font-semibold text-lg">{card.title}</div>
                </div>
              ))}
            </div>
            {/* Wallet address display */}
            <div style={{ marginTop: 10, marginLeft: 150, display: "flex", alignItems: "flex-start", backgroundColor: "rgba(255,255,255,0.05)", padding: 20, borderRadius: 8, boxShadow: "0 2px 6px rgba(0,0,0,0.5)" }}>
              <span style={{ fontFamily: "monospace", fontWeight: "bold", fontSize: 16, marginTop: 10, }}>Copy Address:</span>
              <div
                style={{

                  minHeight: 80,
                  minWidth: 160,
                  marginLeft: 10,
                  display: "flex",
                  fontFamily: "monospace",
                  fontWeight: "bold",
                  fontSize: 16,
                }}
              >
                <WalletAddressWithCopy address={savedWalletAddress} />
              </div>
            </div>

            {/* Right: Add Product button */}
            <Button
              size="large"
              style={{
                background: "#047857", // green-700
                color: "white",
                fontWeight: "600",
                padding: "30px",
                fontSize: 16,
                borderRadius: 10,
                boxShadow: "0 2px 6px rgba(4, 120, 87, 0.7)",
                border: "none",
                marginRight: 120,
                transition: "transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
              }}
              onClick={handleAddClick}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              Add Product
            </Button>
          </div>

          {/* Product Table */}
          <Table
            dataSource={products}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 8 }}
            bordered={false}
          />

          {/* Add Product Modal */}
          <Modal
            title="Add New Product"
            open={modalVisible}
            onOk={handleOk}
            onCancel={() => setModalVisible(false)}
            maskClosable={false}  // Prevent closing on outside click
            cancelButtonProps={{ style: { backgroundColor: 'red', color: 'white', border: 'none', fontSize: 20, padding: '22px', marginRight: 25 } }}
            okButtonProps={{ style: { backgroundColor: '#047857', borderColor: '#047857', color: 'white', fontSize: 20, padding: '22px' } }}
            okText="Save Product"
            destroyOnHidden
            width={800}
            styles={{
              body: {
                minHeight: "320px",
                overflowY: "auto",
                padding: "24px 32px",
              },
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 24,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label className="block font-semibold mb-2">Product Name</label>
                <Input
                  placeholder="Enter product name"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  style={{ height: 44, fontSize: 16, padding: "0 12px" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <label className="block font-semibold mb-2">Price (KSH.)</label>
                <InputNumber
                  placeholder="Enter price"
                  value={form.price}
                  onChange={handlePriceChange}
                  min={0}
                  style={{ width: "100%", height: 44, fontSize: 16 }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <label className="block font-semibold mb-2">Stock/Quantity</label>
                <InputNumber
                  placeholder="Enter quantity"
                  value={form.quantity}
                  onChange={handleStockChange}
                  min={0}
                  style={{ width: "100%", height: 44, fontSize: 16 }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <label className="block font-semibold mb-2">Product Image</label>
                <Upload
                  beforeUpload={beforeUpload}
                  showUploadList={false}
                  onChange={handleImageChange}
                  accept="image/*"
                >
                  <Button icon={<UploadOutlined />} style={{ height: 44, fontSize: 16 }}>
                    Upload Product Image
                  </Button>
                </Upload>
                {form.imagePreview && (
                  <img
                    src={form.imagePreview}
                    alt="Preview"
                    style={{
                      marginTop: 16,
                      height: 120,
                      width: 120,
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid #ccc",
                    }}
                  />
                )}
              </div>
            </div>
          </Modal>

          <WalletSetupModal
            visible={walletModalVisible}
            merchant_id={merchant_id}
            onClose={() => setWalletModalVisible(false)}
            onSubmit={(address) => {
              setSavedWalletAddress(address);
              message.success("Wallet saved successfully!");
              setWalletModalVisible(false);
              localStorage.setItem('your_wallet_address', address);
              console.log("Saved wallet:", address);
            }}
          />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MerchantDashboard;






