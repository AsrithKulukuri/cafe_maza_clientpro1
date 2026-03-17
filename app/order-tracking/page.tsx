"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, ChefHat, Package, Truck, CheckCircle } from "lucide-react";

interface TrackingStage {
    stage: string;
    timestamp: string;
    status: "completed" | "active" | "pending";
    icon: React.ReactNode;
    details: string;
}

export default function OrderTrackingPage() {
    // Mock order tracking data
    const [trackingData] = useState<TrackingStage[]>([
        {
            stage: "Order Placed",
            timestamp: "18:30",
            status: "completed",
            icon: <CheckCircle />,
            details: "Your order has been received and confirmed",
        },
        {
            stage: "Preparing",
            timestamp: "18:35",
            status: "completed",
            icon: <ChefHat />,
            details: "Our chefs are preparing your delicious meal",
        },
        {
            stage: "Ready for Pickup",
            timestamp: "18:52",
            status: "active",
            icon: <Package />,
            details: "Your order is ready and waiting for you",
        },
        {
            stage: "Out for Delivery",
            timestamp: "pending",
            status: "pending",
            icon: <Truck />,
            details: "Your order will be out for delivery soon",
        },
        {
            stage: "Delivered",
            timestamp: "pending",
            status: "pending",
            icon: <CheckCircle />,
            details: "Order delivered to your location",
        },
    ]);

    const completedStages = trackingData.filter((s) => s.status === "completed").length;
    const totalStages = trackingData.length;
    const progressPercent = (completedStages / totalStages) * 100;

    return (
        <div className="min-h-screen bg-[#0B0B0B] p-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto mb-8"
            >
                <p className="text-sm uppercase tracking-[0.2em] text-[#CFAF63]">Real-time</p>
                <h1 className="font-[var(--font-heading)] text-4xl text-[#F5F5F5]">Order Tracking</h1>
                <p className="text-[#999] mt-2">Order #1002 • Placed at 6:30 PM</p>
            </motion.div>

            {/* Main Tracking Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto glass-card rounded-3xl border border-[#CFAF63]/25 p-8"
            >
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-[#999]">Overall Progress</p>
                        <p className="text-sm font-semibold text-[#CFAF63]">{completedStages}/{totalStages} Complete</p>
                    </div>
                    <div className="w-full bg-[#1A1A1A] rounded-full h-3 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-[#CFAF63] to-[#FF6A00]"
                        />
                    </div>
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                    {trackingData.map((stage, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex gap-6"
                        >
                            {/* Timeline Dot & Line */}
                            <div className="flex flex-col items-center relative">
                                <motion.div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl relative z-10 ${stage.status === "completed"
                                            ? "bg-gradient-to-br from-[#CFAF63] to-[#FF6A00] text-[#111]"
                                            : stage.status === "active"
                                                ? "bg-[#3B82F6] text-white animate-pulse"
                                                : "bg-[#222] text-[#666]"
                                        }`}
                                    animate={stage.status === "active" ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                                    transition={{ repeat: stage.status === "active" ? Infinity : 0, duration: 2 }}
                                >
                                    {stage.icon}
                                </motion.div>

                                {/* Vertical Line */}
                                {idx < trackingData.length - 1 && (
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: "80px" }}
                                        transition={{ delay: idx * 0.1 + 0.2, duration: 0.6 }}
                                        className={`w-1 mt-2 ${stage.status === "completed"
                                                ? "bg-gradient-to-b from-[#CFAF63] to-[#FF6A00]"
                                                : "bg-[#333]"
                                            }`}
                                    />
                                )}
                            </div>

                            {/* Stage Info */}
                            <motion.div
                                className="pb-6 flex-1"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: idx * 0.1 + 0.1 }}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <p className="font-[var(--font-heading)] text-lg text-[#F5F5F5]">{stage.stage}</p>
                                    <span
                                        className={`text-xs px-2 py-1 rounded-full font-semibold ${stage.status === "completed"
                                                ? "bg-[#00D98E]/20 text-[#00D98E]"
                                                : stage.status === "active"
                                                    ? "bg-[#3B82F6]/20 text-[#3B82F6] animate-pulse"
                                                    : "bg-[#333]/50 text-[#999]"
                                            }`}
                                    >
                                        {stage.status === "pending" ? "Pending" : stage.status === "active" ? "In Progress" : "Completed"}
                                    </span>
                                </div>
                                <p className="text-[#999] text-sm mb-2">{stage.details}</p>

                                {/* Timestamp */}
                                {stage.timestamp !== "pending" && (
                                    <div className="flex items-center gap-2 text-xs text-[#CFAF63]">
                                        <Clock size={14} />
                                        {stage.timestamp}
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Order Details Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="max-w-2xl mx-auto mt-8 glass-card rounded-2xl border border-[#CFAF63]/25 p-6"
            >
                <h2 className="font-[var(--font-heading)] text-xl text-[#F5F5F5] mb-4">Order Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer Info */}
                    <div>
                        <p className="text-xs uppercase tracking-[0.1em] text-[#999] mb-2">Customer</p>
                        <p className="text-[#F5F5F5] font-semibold">Priya Singh</p>
                        <p className="text-[#999] text-sm">📞 9876543211</p>
                        <p className="text-[#999] text-sm">📍 456 Oak Avenue, Suite 200</p>
                    </div>

                    {/* Order Items */}
                    <div>
                        <p className="text-xs uppercase tracking-[0.1em] text-[#999] mb-2">Items</p>
                        <div className="space-y-1">
                            <p className="text-[#F5F5F5] text-sm">🍗 Paneer Tikka (1x)</p>
                            <p className="text-[#999] text-sm">Estimated total: ₹220</p>
                        </div>
                    </div>

                    {/* Delivery Type */}
                    <div>
                        <p className="text-xs uppercase tracking-[0.1em] text-[#999] mb-2">Order Type</p>
                        <span className="inline-block px-3 py-1 rounded-full bg-[#FF6A00]/20 text-[#FF6A00] text-sm font-semibold">
                            🛍️ Takeaway
                        </span>
                    </div>

                    {/* Estimated Time */}
                    <div>
                        <p className="text-xs uppercase tracking-[0.1em] text-[#999] mb-2">Estimated Delivery</p>
                        <p className="text-[#F5F5F5] text-sm">Today, 7:15 PM</p>
                    </div>
                </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="max-w-2xl mx-auto mt-6 flex gap-4 justify-center"
            >
                <button className="px-6 py-3 rounded-full border border-[#CFAF63]/25 text-[#F5F5F5] hover:bg-[#1A1A1A] transition">
                    📞 Contact Support
                </button>
                <button className="px-6 py-3 rounded-full bg-gradient-to-r from-[#CFAF63] to-[#FF6A00] text-[#111] font-semibold hover:shadow-lg transition">
                    🔄 Refresh Status
                </button>
            </motion.div>
        </div>
    );
}
