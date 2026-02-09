
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
  Select,
  Cascader,
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
  category_name?: string;
  supplier_name?: string;
  category_id?: string;
  supplier_id?: string;
};

type Category = {
  id: string;
  name: string;
  parent_id?: string | null;
  children?: Category[];
};

type Supplier = {
  id: string;
  name: string;
};

const MerchantDashboard: React.FC = () => {
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [savedWalletAddress, setSavedWalletAddress] = useState("");
  const [merchantusername, setMerchantUsername] = useState("User");
  const [merchant_id, setMerchantId] = useState("0 merchant_id");

  const [collapsed, setCollapsed] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]); // Cascader options
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState({
    name: "",
    price: 0,
    quantity: 0,
    imageFile: null as File | null,
    imagePreview: "",
    category_id: "",
    supplier_id: "",
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
    setForm({ name: "", price: 0, quantity: 0, imageFile: null, imagePreview: "", category_id: "", supplier_id: "" });
  };

  const handleAddClick = () => {
    resetForm();
    setModalVisible(true);
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const id = localStorage.getItem('merchant_id');
        if (!id) return;

        // 1. Fetch Products
        const prodRes = await api.get(`/getMerchantProducts/${id}`);
        setProducts(prodRes.data.data);

        // 2. Fetch Categories
        const catRes = await api.get('/categories'); // Assuming endpoint is /categories
        const rawCats = catRes.data.data;
        const catTree = buildCategoryTree(rawCats);
        setCategories(catTree);

        // 3. Fetch Suppliers
        const supRes = await api.get('/suppliers'); // Assuming endpoint is /suppliers
        setSuppliers(supRes.data.data);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // message.error("Failed to load dashboard data.");
      }
    };

    fetchAllData();
  }, []);

  const buildCategoryTree = (items: any[]) => {
    const itemMap = new Map();
    items.forEach(item => itemMap.set(item.id, { ...item, value: item.id, label: item.name, children: [] }));

    const tree: any[] = [];
    items.forEach(item => {
      if (item.parent_id) {
        const parent = itemMap.get(item.parent_id);
        if (parent) {
          parent.children.push(itemMap.get(item.id));
        }
      } else {
        tree.push(itemMap.get(item.id));
      }
    });

    // Clean up empty children arrays for Antd Cascader
    const cleanTree = (nodes: any[]) => {
      nodes.forEach(node => {
        if (node.children.length === 0) {
          delete node.children;
        } else {
          cleanTree(node.children);
        }
      });
    };
    cleanTree(tree);

    return tree;
  };



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
        walletAddressed,
        category_id: form.category_id,
        supplier_id: form.supplier_id
      };

      const response = await api.post("/AddProduct", productPayload);

      message.success("Product added successfully!");
      console.log("Server response:", response.data);
      setModalVisible(false);
      resetForm();
      // fetchAllData(); // Ideally refresh everything
      window.location.reload(); // Quick fix for now to refresh lists
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
      title: "Category",
      dataIndex: "category_name",
      key: "category",
      render: (text: string) => text || "N/A",
    },
    {
      title: "Supplier",
      dataIndex: "supplier_name",
      key: "supplier",
      render: (text: string) => text || "N/A",
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
    <>
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
        <div style={{ display: "flex", gap: 24, flex: 1 }}>
          {[
            { title: "View Transactions", icon: <DollarOutlined /> },
            { title: "View Orders", icon: <ShopOutlined /> },
            { key: "view-wallet", title: "View Wallet Address", icon: <UserOutlined /> },
          ].map((card) => (
            <div
              key={card.key || card.title}
              onClick={() => handleCardClick(card.key)}
              className="shadow-sm hover:shadow-md transition-all rounded-xl p-6 bg-white border border-gray-100 cursor-pointer flex items-center space-x-4 group"
              style={{ flex: 1, minHeight: 120 }}
            >
              <div
                style={{
                  fontSize: 28,
                  color: "#16a34a",
                  backgroundColor: "#dcfce7",
                  padding: 12,
                  borderRadius: "50%",
                  display: "flex",
                }}
              >
                {card.icon}
              </div>
              <div className="font-semibold text-lg text-gray-700 group-hover:text-green-600 transition-colors">
                {card.title}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Add Product button */}
        <Button
          size="large"
          icon={<ShopOutlined />}
          style={{
            background: "#16a34a",
            color: "white",
            fontWeight: "600",
            height: 60,
            padding: "0 40px",
            fontSize: 16,
            borderRadius: 12,
            border: "none",
            boxShadow: "0 4px 6px -1px rgba(22, 163, 74, 0.4)",
          }}
          onClick={handleAddClick}
        >
          Add Product
        </Button>
      </div>

      {/* Wallet address display (move to a cleaner spot or modal, but keeping here for now with better style) */}
      <div style={{ marginBottom: 24, padding: 20, background: 'white', borderRadius: 12, border: '1px solid #f0f0f0', display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontWeight: "bold", color: "#6b7280" }}>Your Wallet Address:</span>
        <WalletAddressWithCopy address={savedWalletAddress} />
      </div>

      {/* Product Table */}
      <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #f0f0f0' }}>
        <Title level={4} style={{ marginTop: 0, marginBottom: 24 }}>Recent Products</Title>
        <Table
          dataSource={products}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          style={{}}
        />
      </div>

      {/* Add Product Modal */}
      <Modal
        title="Add New Product"
        open={modalVisible}
        onOk={handleOk}
        onCancel={() => setModalVisible(false)}
        maskClosable={false}
        okButtonProps={{ style: { backgroundColor: '#16a34a', borderColor: '#16a34a' } }}
        okText="Save Product"
        width={800}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 24 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label className="block font-semibold mb-2">Product Name</label>
            <Input
              placeholder="Enter product name"
              name="name"
              value={form.name}
              onChange={handleInputChange}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <label className="block font-semibold mb-2">Price (KSH.)</label>
            <InputNumber
              placeholder="Enter price"
              value={form.price}
              onChange={handlePriceChange}
              min={0}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <label className="block font-semibold mb-2">Stock/Quantity</label>
            <InputNumber
              placeholder="Enter quantity"
              value={form.quantity}
              onChange={handleStockChange}
              min={0}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <label className="block font-semibold mb-2">Category</label>
            <Cascader
              options={categories}
              placeholder="Select Category"
              onChange={(value) => setForm((prev) => ({ ...prev, category_id: value ? String(value[value.length - 1]) : "" }))}
              changeOnSelect
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <label className="block font-semibold mb-2">Supplier</label>
            <Select
              placeholder="Select Supplier"
              value={form.supplier_id || undefined}
              onChange={(value) => setForm((prev) => ({ ...prev, supplier_id: value }))}
              style={{ width: "100%" }}
            >
              {suppliers.map(s => (
                <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
              ))}
            </Select>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <label className="block font-semibold mb-2">Product Image</label>
            <Upload
              beforeUpload={beforeUpload}
              showUploadList={false}
              onChange={handleImageChange}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />}>Upload Product Image</Button>
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
                  border: "1px solid #e5e7eb",
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
    </>
  );
};

export default MerchantDashboard;






