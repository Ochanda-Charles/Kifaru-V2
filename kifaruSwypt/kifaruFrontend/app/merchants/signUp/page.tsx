"use client";

import React, { useState } from "react";
import api from "@/app/utilis/api";
import { openNotification } from "../../utilis/notification";
import { useRouter } from "next/navigation";
import { Sparkles, User, Mail, Lock, Eye, EyeOff } from "lucide-react";

const SignupPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const merchantUserName = formData.get("merchantUserName")?.toString().trim();
    const merchantEmail = formData.get("merchantEmail")?.toString().trim();
    const password = formData.get("password")?.toString().trim();

    if (!merchantUserName || !merchantEmail || !password) {
      const msg = "All fields are required.";
      setError(msg);
      openNotification(msg, "error");
      setLoading(false);
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(merchantEmail)) {
      const msg = "Please enter a valid email address.";
      setError(msg);
      openNotification(msg, "error");
      setLoading(false);
      return;
    }

    setError(null);

    try {
      const res = await api.post("/signup", {
        merchantUserName,
        merchantEmail,
        password,
      });

      if (res?.data?.message) {
        openNotification(res.data.message, "success");
        router.push("/merchants/login"); // Redirect to login after signup
      }
    } catch (err: any) {
      const message = err.response?.data?.error || "Signup failed.";
      setError(message);
      openNotification(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background elements to match landing page */}
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-gray-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-white/50 backdrop-blur-sm">
          {/* Logo/Branding */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-white to-green-50 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 mb-4">
              <span className="text-green-600 font-black text-2xl transform -rotate-3">K</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Create Account</h1>
            <p className="text-gray-500 text-sm mt-1">Join Kifaru Swypt as a Merchant</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="merchantUserName" className="text-sm font-bold text-gray-700 ml-1">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  id="merchantUserName"
                  name="merchantUserName"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900"
                  placeholder="Your business name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="merchantEmail" className="text-sm font-bold text-gray-700 ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  id="merchantEmail"
                  name="merchantEmail"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900"
                  placeholder="name@business.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-bold text-gray-700 ml-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-green-600 via-green-700 to-black text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Sparkles size={20} />
                  Sign Up Now
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-gray-100">
            <p className="text-gray-500 text-sm">
              Already have an account?{" "}
              <a
                href="/merchants/login"
                className="text-green-600 font-bold hover:text-green-700 transition-colors"
              >
                Log in instead
              </a>
            </p>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="text-center mt-6">
          <a href="/" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
            ← Back to Kifaru Swypt Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
