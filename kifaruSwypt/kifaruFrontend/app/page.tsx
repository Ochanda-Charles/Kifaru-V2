"use client";

import React, { useEffect, useState } from "react";
import { DepositModal } from "swypt-checkout";
import { ShoppingCart, Instagram, Twitter, Facebook, X, Star, Heart, Sparkles, Menu, LogIn, ChevronRight } from "lucide-react";
import "swypt-checkout/dist/styles.css";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/app/utilis/api";


// Type definitions
interface Product {
  id: string;
  name: string;
  description: string;
  imageurl: string;
  price: number;
  category: string;
  rating: number;
  bestseller?: boolean;
  new?: boolean;
  quantity?: number;
  walletaddressed?: string;

}

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartPanelProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
  total: number;
}

interface CartIconProps {
  itemCount: number;
  onClick: () => void;
}

interface HeaderProps {
  cartItemCount: number;
  onCartClick: () => void;
  isLoggedIn: boolean;
  onLogout: () => void;
}

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  isSelected: boolean;
}

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}


const CartPanel: React.FC<CartPanelProps> = ({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onCheckout,
  total,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity z-40"
        onClick={onClose}
      />
      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 
        transform transition-transform duration-500 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-green-50 to-white">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Your Cart</h3>
              <p className="text-sm text-gray-500">{items.length} beautiful items</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/80 rounded-full transition-all duration-200"
              type="button"
            >
              <X size={22} className="text-gray-600" />
            </button>
          </div>

          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart size={32} className="text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Cart is empty</h4>
              <p className="text-gray-500 text-center">Add some beautiful products to get started!</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {items.map((item: CartItem, index) => (
                    <div
                      key={item.product.id}
                      className={`bg-gray-50 rounded-xl p-4 transform transition-all duration-300 hover:shadow-md ${index % 2 === 0 ? 'animate-fadeInLeft' : 'animate-fadeInRight'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <img
                            src={item.product.imageurl}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover rounded-lg shadow-sm"
                          />
                          {item.product.bestseller && (
                            <Star size={12} className="absolute -top-1 -right-1 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {item.product.name}
                          </h4>
                          <p className="text-sm text-green-600 font-medium">
                            KES {item.product.price.toLocaleString()}
                          </p>
                          <span className="inline-block text-xs text-gray-500 bg-white px-2 py-1 rounded-full mt-1">
                            {item.product.quantity}
                          </span>
                          <span className="inline-block text-xs text-gray-500 bg-white px-2 py-1 rounded-full mt-1">
                            {item.product.category}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-sm font-medium text-gray-700 bg-white px-2 py-1 rounded-full">
                            ×{item.quantity}
                          </span>
                          <button
                            onClick={() => onRemoveItem(item.product.id)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                            type="button"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t bg-gradient-to-r from-green-50 to-white p-6">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-semibold text-gray-900">
                    Total Amount
                  </span>
                  <span className="text-2xl font-bold text-green-600">
                    KES {total.toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={onCheckout}
                  className="w-full bg-gradient-to-r from-green-600 via-green-700 to-black text-white py-4 px-6 
                  rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 
                  transform hover:scale-[1.02] hover:-translate-y-1"
                  type="button"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles size={20} />
                    Complete Purchase
                    <Sparkles size={20} />
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

const CartIcon: React.FC<CartIconProps> = ({ itemCount, onClick }) => (
  <button
    onClick={onClick}
    className="relative p-3 text-white hover:text-green-200 transition-all duration-200 group"
    type="button"
    aria-label={`Shopping cart with ${itemCount} items`}
  >
    <ShoppingCart size={24} className="group-hover:scale-110 transition-transform duration-200" />
    {itemCount > 0 && (
      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-green-400 to-green-600 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full font-bold shadow-lg animate-pulse">
        {itemCount}
      </span>
    )}
  </button>
);

const NavLinks: React.FC<{ mobile?: boolean }> = ({ mobile }) => {
  const links = [
    { name: "Features", href: "#features" },
    { name: "Solutions", href: "#solutions" },
    { name: "Pricing", href: "#pricing" },
  ];

  return (
    <nav className={`${mobile ? "flex flex-col gap-4" : "hidden md:flex items-center gap-8"}`}>
      {links.map((link) => (
        <a
          key={link.name}
          href={link.href}
          className="text-gray-600 hover:text-green-600 font-medium transition-colors"
        >
          {link.name}
        </a>
      ))}
    </nav>
  );
};

const AuthButtons: React.FC<{ isLoggedIn: boolean; mobile?: boolean; onLogout: () => void }> = ({ isLoggedIn, mobile, onLogout }) => {
  const router = useRouter();

  if (isLoggedIn) {
    return (
      <div className={`${mobile ? "flex flex-col gap-4" : "flex items-center gap-4"}`}>
        <button
          onClick={() => router.push("/merchants/dashboard")}
          className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
        >
          Dashboard <ChevronRight size={18} />
        </button>
        <button
          onClick={onLogout}
          className="text-gray-600 font-medium hover:text-red-600 transition-colors"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className={`${mobile ? "flex flex-col gap-4" : "flex items-center gap-4"}`}>
      <button
        onClick={() => router.push("/merchants/login")}
        className="text-gray-600 font-medium hover:text-green-600 transition-colors"
      >
        Log In
      </button>
      <button
        onClick={() => router.push("/merchants/signUp")}
        className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-700 transition-all shadow-md hover:shadow-lg"
      >
        Get Started
      </button>
    </div>
  );
};

const Header: React.FC<HeaderProps & { isMobileMenuOpen: boolean; setIsMobileMenuOpen: (val: boolean) => void }> = ({
  cartItemCount,
  onCartClick,
  isLoggedIn,
  onLogout,
  isMobileMenuOpen,
  setIsMobileMenuOpen
}) => (
  <header className="fixed top-0 left-0 right-0 z-[60] bg-white/80 backdrop-blur-xl border-b border-green-100 shadow-sm">
    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-12">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="relative">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform duration-300">
              <span className="text-white font-black text-lg">K</span>
            </div>
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Kifaru Swypt</h1>
            <p className="text-green-600 text-[10px] font-bold leading-none">VIRTUAL POS</p>
          </div>
        </div>

        <NavLinks />
      </div>

      <div className="hidden md:flex items-center gap-6">
        <CartIcon itemCount={cartItemCount} onClick={onCartClick} />
        <div className="h-6 w-px bg-gray-200 mx-2" />
        <AuthButtons isLoggedIn={isLoggedIn} onLogout={onLogout} />
      </div>

      <div className="md:hidden flex items-center gap-4">
        <CartIcon itemCount={cartItemCount} onClick={onCartClick} />
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-600 hover:text-green-600 transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </div>

    {/* Mobile Menu */}
    {isMobileMenuOpen && (
      <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-green-100 p-6 animate-fadeInDown">
        <div className="flex flex-col gap-8">
          <NavLinks mobile />
          <div className="h-px bg-gray-100" />
          <AuthButtons isLoggedIn={isLoggedIn} onLogout={onLogout} mobile />
        </div>
      </div>
    )}
  </header>
);



const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, isSelected }) => (
  <div
    onClick={onClick}
    className={`group bg-white rounded-3xl p-6 shadow-lg cursor-pointer border-2 border-transparent
    transform transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl hover:border-green-200
    ${isSelected ? "ring-4 ring-green-300 scale-[1.02] shadow-xl border-green-300" : ""}
    hover:-translate-y-2`}
    role="button"
    tabIndex={0}
    onKeyDown={(e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    }}
  >
    <div className="relative overflow-hidden rounded-2xl mb-5">
      <img
        src={product.imageurl}
        alt={product.name}
        className="w-full h-52 object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute top-3 left-3 flex gap-2">
        {product.bestseller && (
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg flex items-center gap-1">
            <Star size={12} className="fill-current" />
            Bestseller
          </span>
        )}
        {product.new && (
          <span className="bg-gradient-to-r from-green-400 to-green-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg">
            New
          </span>
        )}
      </div>
      <div className="absolute top-3 left-1">
        <span className={`inline-block text-xs px-1 py-1 rounded-full mt-1 ${product.quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {product.quantity} in stock
        </span>
      </div>
      <div className="absolute top-3 right-3">
        <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-semibold shadow-sm">
          {product.category}
        </span>
      </div>
      <div className="absolute bottom-3 right-3">
        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
          <Star size={12} className="text-yellow-500 fill-current" />
          <span className="text-xs font-semibold text-gray-700">{product.rating}</span>
        </div>
      </div>
    </div>

    <div className="space-y-3">
      <h4 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-green-700 transition-colors">
        {product.name}
      </h4>
      <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
        {product.description}
      </p>
      <div className="flex items-center justify-between pt-2">
        <div className="flex flex-col">
          <span className="text-2xl font-black text-green-600">
            KES {product.price.toLocaleString()}
          </span>
          <span className="text-xs text-gray-500">Free shipping</span>
        </div>
        <button
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 
          text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl 
          transition-all duration-300 transform hover:scale-105 hover:-translate-y-1
          flex items-center gap-2"
          type="button"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <Heart size={16} />
          Add to Cart
        </button>
      </div>
    </div>
  </div>
);

const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, selectedCategory, onCategoryChange }) => (
  <div className="flex flex-wrap gap-3 mb-8">
    <button
      onClick={() => onCategoryChange("All")}
      className={`px-6 py-3 rounded-2xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${selectedCategory === "All"
        ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
        }`}
      type="button"
    >
      ✨ All Products
    </button>
    {categories.map((category: string) => (
      <button
        key={category}
        onClick={() => onCategoryChange(category)}
        className={`px-6 py-3 rounded-2xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${selectedCategory === category
          ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
          }`}
        type="button"
      >
        {category === "Skincare" && "🌿 "}
        {category === "Makeup" && "💄 "}
        {category === "Fragrance" && "🌸 "}
        {category === "Body Care" && "🧴 "}
        {category}
      </button>
    ))}
  </div>
);

const Footer: React.FC = () => (
  <footer className="bg-gradient-to-r from-black via-gray-900 to-green-800 text-white py-12">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-white to-green-50 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-green-600 font-black text-xl">K</span>
            </div>
            <div>
              <h3 className="text-2xl font-black">Kifaru Swypt</h3>
              <p className="text-green-200 text-sm">Empowering merchants with Stablecoin payments</p>
            </div>
          </div>
          <p className="text-green-100 leading-relaxed max-w-md">
            We're on a mission to revolutionize commerce for African merchants. Our virtual POS allows you to manage inventory, track sales, and receive payments in stablecoins seamlessly.
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-4 text-lg">Platform Features</h4>
          <ul className="space-y-3 text-green-100">
            <li className="hover:text-white transition-colors cursor-pointer">📦 Inventory Management</li>
            <li className="hover:text-white transition-colors cursor-pointer">📊 Sales Analytics</li>
            <li className="hover:text-white transition-colors cursor-pointer">🔗 Stablecoin Payments</li>
            <li className="hover:text-white transition-colors cursor-pointer">📱 Multi-device Sync</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4 text-lg">Merchant Support</h4>
          <ul className="space-y-3 text-green-100">
            <li className="hover:text-white transition-colors cursor-pointer">📞 24/7 Priority Support</li>
            <li className="hover:text-white transition-colors cursor-pointer">📚 Merchant Guides</li>
            <li className="hover:text-white transition-colors cursor-pointer">🛠 Implementation APIs</li>
            <li className="hover:text-white transition-colors cursor-pointer">❓ Platform FAQ</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/20 mt-10 pt-8 flex flex-col md:flex-row items-center justify-between">
        <p className="text-green-100 text-sm mb-4 md:mb-0">
          © 2024 Kifaru Swypt. Empowering global commerce through blockchain technology.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-green-200 text-sm">Secure payments powered by</span>
          <span className="text-white font-semibold">Swypt</span>
        </div>
      </div>
    </div>
  </footer>
);

const KifaruBeautyStore: React.FC = () => {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem("merchantToken");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("merchantToken");
    localStorage.removeItem("merchant_id");
    setIsLoggedIn(false);
    router.push("/");
  };
  interface ClickedProduct {
    id: number;
    name: string;
  }

  const [whichproducts, setWhichProducts] = useState<ClickedProduct[]>([]);

  // setWhichProducts((prev) => {
  //   const exists = prev.some((p) => p.id === products.id);
  //   if (exists) return prev;   
  //   return [...prev, { id: products.id, name: products.name }];
  // });


  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get("/getProducts");
        setProducts(response.data.message);
        console.log("Products fetched:", response.data);
        const merchantAddress = response.data.message[0].walletaddressed;
        console.log("Merchant Address:", merchantAddress);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);


  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // const merchantAddress: string = "0x21255cdbdAfF23D27bE0E00E79b8b03a14A32ab1";
  const merchantAddress: string = products.length > 0 ? products[0].walletaddressed : null;
  console.log("Merchanteeezz Address:", merchantAddress);
  const categories: string[] = Array.from(new Set(products.map((product: Product) => product.category)));

  const filteredProducts: Product[] = selectedCategory === "All"
    ? products
    : products.filter((product: Product) => product.category === selectedCategory);

  const handleProductSelect = (product: Product): void => {
    setCartItems((prevItems: CartItem[]) => {
      const existingItem = prevItems.find(
        (item: CartItem) => item.product.id === product.id
      );
      if (existingItem) {
        return prevItems.map((item: CartItem) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (productId: string): void => {
    setCartItems((prevItems: CartItem[]) =>
      prevItems.filter((item: CartItem) => item.product.id !== productId)
    );
  };

  const cartTotal: number = cartItems.reduce(
    (total: number, item: CartItem) => total + item.product.price * item.quantity,
    0
  );

  const cartItemCount: number = cartItems.reduce(
    (count: number, item: CartItem) => count + item.quantity,
    0
  );

  const handleCheckout = (): void => {
    setIsCartOpen(false);
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      setIsModalOpen(true);
    }, 200);
  };

  const handlePaymentSuccess = async () => {
    try {
      console.log("Payment successful, syncing inventory...");
      // Replace with your actual backend URL or env variable
      const API_URL = "http://localhost:5000";

      await api.post("/inventory/checkout", {
        items: cartItems,
        paymentData: { method: 'crypto' }, // Swypt might provide more data if we had the object
        customerDetails: {}
      });

      setCartItems([]);
      setIsModalOpen(false);
      // You might want a better success UI here
      alert("Purchase successful! Stock updated.");
    } catch (error) {
      console.error("Inventory sync failed:", error);
      alert("Payment successful but inventory update failed. Please contact support.");
    }
  };

  const handleCloseModal = (): void => {
    document.body.style.overflow = 'auto';
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50">
      {/* Organic background shapes */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-gradient-to-br from-green-200/30 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 right-0 w-80 h-80 bg-gradient-to-bl from-gray-200/40 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-gradient-to-tr from-green-300/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-radial from-white/50 to-transparent rounded-full blur-2xl"></div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
            onClick={handleCloseModal}
          />
          <div className="relative z-50 max-w-2xl w-full">
            <DepositModal
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              headerBackgroundColor="linear-gradient(135deg, #000000 0%, #1f2937 50%, #16a34a 100%)"
              businessName="Kifaru Beauty"
              merchantName="Kifaru Beauty Store"
              merchantAddress={merchantAddress}
              amount={cartTotal}
              // @ts-ignore - Swypt documentation or types might be outdated regarding onSuccess
              onSuccess={handlePaymentSuccess}
            />
          </div>
        </div>
      )}

      <CartPanel
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={handleCheckout}
        total={cartTotal}
      />



      <Header
        cartItemCount={cartItemCount}
        onCartClick={() => setIsCartOpen(true)}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <main className="relative z-10 max-w-7xl w-full mx-auto px-6 pt-32 pb-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Sparkles size={16} />
            Virtual POS for Modern Commerce
            <Sparkles size={16} />
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-6 leading-tight">
            The Smart Way to
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-green-700 to-black">
              Manage & Get Paid
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Empower your business with a virtual POS that lets you track goods and receive stablecoin payments instantly.
            Secure, fast, and built for the future of merchant commerce.
          </p>
        </div>


        {/* Trust indicators */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Instant Settlements</h4>
            <p className="text-sm text-gray-600">Receive stablecoins directly in your wallet</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🛡️</span>
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Secure Transactions</h4>
            <p className="text-sm text-gray-600">Blockchain-verified payment security</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📉</span>
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Low Fees</h4>
            <p className="text-sm text-gray-600">Fraction of the cost of traditional card networks</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔄</span>
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Inventory Sync</h4>
            <p className="text-sm text-gray-600">Real-time tracking across all locations</p>
          </div>
        </div>

        {/* Join CTA Section */}
        <div className="mt-24 mb-8 bg-gradient-to-r from-green-600 via-green-700 to-black rounded-[2rem] p-12 text-center text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-full z-0 opacity-20">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-green-400/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
          </div>
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
              Ready to transform your business?
            </h2>
            <p className="text-xl text-green-50 mb-10 leading-relaxed">
              Join thousands of merchants who are growing their business and accepting global payments with Kifaru Swypt.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push("/merchants/signUp")}
                className="w-full sm:w-auto bg-white text-green-700 px-10 py-4 rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                Sign Up as a Merchant
              </button>
              <button
                onClick={() => router.push("/merchants/login")}
                className="w-full sm:w-auto bg-green-500/20 backdrop-blur-md border border-white/30 text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-green-500/30 transition-all duration-300 transform hover:scale-105"
              >
                Merchant Login
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default KifaruBeautyStore;





