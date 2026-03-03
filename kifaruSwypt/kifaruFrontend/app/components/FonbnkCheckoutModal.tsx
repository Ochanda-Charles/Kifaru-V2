"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import api from "@/app/utilis/api";

interface FonbnkCheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (data?: { orderId?: string; orderParams?: string }) => void;
    amount: number;
    merchantAddress?: string;
    merchantId?: string;
    businessName: string;
}

const FonbnkCheckoutModal: React.FC<FonbnkCheckoutModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    amount,
    merchantAddress,
    merchantId,
    businessName,
}) => {
    const [widgetUrl, setWidgetUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const [orderParams, setOrderParams] = useState<string | undefined>(undefined);

    // Listen for postMessage events from the Fonbnk iframe
    useEffect(() => {
        if (!isOpen) return;

        const handleMessage = (event: MessageEvent) => {
            try {
                const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
                if (data.source !== "fonbnk") return;

                if (data.event === "order-created") {
                    // Capture the Fonbnk orderId so checkout can link the transaction
                    const orderId = data.orderId || data.order_id || data.id || undefined;
                    const paramsFromEvent = data.orderParams || data.merchantOrderParams || orderParams;
                    console.log('[Fonbnk] order-created, orderId:', orderId, 'full data:', JSON.stringify(data));
                    onSuccess({ orderId, orderParams: paramsFromEvent });
                } else if (data.event === "close-iframe") {
                    onClose();
                }
            } catch {
                // Ignore non-JSON messages from other sources
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [isOpen, onSuccess, onClose, orderParams]);

    // Fetch widget URL when modal opens
    useEffect(() => {
        if (!isOpen) {
            setWidgetUrl(null);
            setLoading(false);
            setError(null);
            setIframeLoaded(false);
            setOrderParams(undefined);
            return;
        }

        if (amount > 0) {
            fetchWidgetUrl();
        }
    }, [isOpen]);

    const fetchWidgetUrl = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.post("/swypt/widget-url", {
                amount,
                merchantWalletAddress: merchantAddress,
                merchant_id: merchantId,
            });
            if (res.data.success) {
                setWidgetUrl(res.data.data.widgetUrl);
                setOrderParams(res.data.data.orderParams);
            } else {
                setError(res.data.error || "Failed to initialize payment");
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to initialize payment. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-md"
                onClick={handleClose}
            />
            <div className="relative z-50 w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-black via-gray-900 to-green-600 p-4 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-lg font-bold">{businessName}</h2>
                            <p className="text-green-200 text-sm mt-0.5">Secure M-Pesa Payment</p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-1 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="mt-2 text-2xl font-black">
                        KES {amount.toLocaleString()}
                    </div>
                </div>

                {/* Body */}
                <div className="relative">
                    {/* Loading state */}
                    {(loading || (!iframeLoaded && widgetUrl)) && (
                        <div className="flex flex-col items-center justify-center py-16 gap-4">
                            <Loader2 size={40} className="text-green-600 animate-spin" />
                            <p className="text-gray-600 text-sm">
                                {loading ? "Preparing payment..." : "Loading payment widget..."}
                            </p>
                        </div>
                    )}

                    {/* Error state */}
                    {error && (
                        <div className="p-6 text-center space-y-4">
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                                {error}
                            </div>
                            <button
                                onClick={fetchWidgetUrl}
                                className="bg-green-600 text-white py-2 px-6 rounded-xl font-semibold hover:bg-green-700 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* Fonbnk Widget iframe */}
                    {widgetUrl && !error && (
                        <iframe
                            src={widgetUrl}
                            className={`w-full border-0 transition-opacity duration-300 ${
                                iframeLoaded ? "opacity-100" : "opacity-0 absolute"
                            }`}
                            style={{ height: "520px" }}
                            onLoad={() => setIframeLoaded(true)}
                            allow="payment"
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 text-center border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                        Powered by Fonbnk &middot; Secure blockchain payments
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FonbnkCheckoutModal;
