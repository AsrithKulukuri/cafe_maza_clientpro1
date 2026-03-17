"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut, Navigation, Zap, Truck, Home } from "lucide-react";
import { mockDeliveries } from "@/data/mockData";

type DeliveryStatus = "assigned" | "picked-up" | "out-for-delivery" | "delivered";

export default function DeliveryDashboard() {
    const router = useRouter();
    const [deliveryInfo, setDeliveryInfo] = useState<{ deliveryId: string; name: string; phone: string } | null>(null);
    const [deliveries, setDeliveries] = useState(mockDeliveries);
    const [activeTab, setActiveTab] = useState<DeliveryStatus>("assigned");

    useEffect(() => {
        const delivery = localStorage.getItem("deliveryLoggedIn");
        if (!delivery) {
            router.push("/delivery-login");
            return;
        }
        setDeliveryInfo(JSON.parse(delivery));
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("deliveryLoggedIn");
        router.push("/delivery-login");
    };

    const updateDeliveryStatus = (deliveryId: string, newStatus: DeliveryStatus) => {
        setDeliveries(deliveries.map((del) => (del.id === deliveryId ? { ...del, status: newStatus } : del)));
    };

    const getDeliveriesByStatus = (status: DeliveryStatus) => deliveries.filter((del) => del.status === status);

    const statusConfig = {
        assigned: { icon: Zap, label: "Assigned Orders", color: "text-[#FF6A00]", bg: "bg-[#FF6A00]/10", border: "border-[#FF6A00]/25" },
        "picked-up": { icon: Truck, label: "Picked Up", color: "text-[#CFAF63]", bg: "bg-[#CFAF63]/10", border: "border-[#CFAF63]/25" },
        "out-for-delivery": { icon: Navigation, label: "Out for Delivery", color: "text-[#3B82F6]", bg: "bg-[#3B82F6]/10", border: "border-[#3B82F6]/25" },
        delivered: { icon: Home, label: "Delivered", color: "text-[#00D98E]", bg: "bg-[#00D98E]/10", border: "border-[#00D98E]/25" },
    };

    if (!deliveryInfo) return null;

    const tabs: DeliveryStatus[] = ["assigned", "picked-up", "out-for-delivery", "delivered"];
    const currentDeliveries = getDeliveriesByStatus(activeTab);

    return (
        <div className="min-h-screen bg-[#0B0B0B] p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <p className="text-sm uppercase tracking-[0.2em] text-[#FF6A00]">Welcome,</p>
                    <h1 className="font-[var(--font-heading)] text-4xl text-[#F5F5F5]">{deliveryInfo.name}</h1>
                    <p className="text-sm text-[#999] mt-1">ID: {deliveryInfo.deliveryId}</p>
                </motion.div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF6A00]/20 text-[#FF6A00] hover:bg-[#FF6A00]/30 transition"
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {tabs.map((tab) => {
                    const count = getDeliveriesByStatus(tab).length;
                    const config = statusConfig[tab];
                    const Icon = config.icon;
                    return (
                        <motion.button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            whileHover={{ scale: 1.05 }}
                            className={`glass-card border p-4 rounded-2xl text-left transition ${activeTab === tab
                                    ? `border-[#CFAF63] ${config.bg}`
                                    : `border-[#333] hover:border-[#CFAF63]/50`
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.15em] text-[#999]">{config.label}</p>
                                    <p className={`text-3xl font-bold mt-2 ${config.color}`}>{count}</p>
                                </div>
                                <Icon className={`${config.color}`} size={24} />
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Deliveries Grid */}
            <div>
                <h2 className="font-[var(--font-heading)] text-2xl text-[#F5F5F5] mb-4">
                    {statusConfig[activeTab].label}
                </h2>

                {currentDeliveries.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass-card rounded-2xl border border-[#333] p-8 text-center"
                    >
                        <p className="text-[#999]">No deliveries in this status</p>
                    </motion.div>
                ) : (
                    <motion.div
                        layout
                        className="space-y-4"
                    >
                        {currentDeliveries.map((delivery, idx) => (
                            <motion.div
                                key={delivery.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="glass-card rounded-2xl border border-[#CFAF63]/25 p-6 hover:border-[#CFAF63]/50 transition"
                            >
                                {/* Delivery Header */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-[#333]">
                                    {/* Left: Customer Info */}
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.1em] text-[#CFAF63] mb-2">Customer</p>
                                        <p className="font-semibold text-[#F5F5F5] text-lg">{delivery.customerName}</p>
                                        <p className="text-sm text-[#999]">📞 {delivery.customerPhone}</p>
                                        <p className="text-xs text-[#666] mt-2">Delivery ID: {delivery.deliveryId}</p>
                                    </div>

                                    {/* Right: Order Info */}
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.1em] text-[#FF6A00] mb-2">Order</p>
                                        <p className="font-semibold text-[#F5F5F5]">Order #{delivery.orderId}</p>
                                        <p className="text-sm text-[#CFAF63]">Items: {delivery.items.join(", ")}</p>
                                    </div>
                                </div>

                                {/* Address Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-[#333]">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.1em] text-[#999] mb-1">Pickup Location</p>
                                        <p className="text-sm text-[#CCC]">{delivery.pickupAddress}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.1em] text-[#999] mb-1">Delivery Address</p>
                                        <p className="text-sm text-[#CCC]">{delivery.deliveryAddress}</p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-2">
                                    {activeTab === "assigned" && (
                                        <button
                                            onClick={() => updateDeliveryStatus(delivery.id, "picked-up")}
                                            className="w-full py-2 bg-gradient-to-r from-[#CFAF63] to-[#FF6A00] text-[#111] rounded-lg font-semibold hover:shadow-lg transition text-sm"
                                        >
                                            📦 Mark as Picked Up
                                        </button>
                                    )}
                                    {activeTab === "picked-up" && (
                                        <button
                                            onClick={() => updateDeliveryStatus(delivery.id, "out-for-delivery")}
                                            className="w-full py-2 bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] text-white rounded-lg font-semibold hover:shadow-lg transition text-sm"
                                        >
                                            🚗 Out for Delivery
                                        </button>
                                    )}
                                    {activeTab === "out-for-delivery" && (
                                        <button
                                            onClick={() => updateDeliveryStatus(delivery.id, "delivered")}
                                            className="w-full py-2 bg-[#00D98E]/20 text-[#00D98E] rounded-lg font-semibold hover:bg-[#00D98E]/30 transition text-sm"
                                        >
                                            ✓ Mark Delivered
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
