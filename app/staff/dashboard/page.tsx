"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut, Clock, CheckCircle, Zap, Monitor } from "lucide-react";
import { mockOrders, mockScreeningBookings, type ScreeningBooking } from "@/data/mockData";

type OrderStatus = "new" | "preparing" | "ready" | "completed";

export default function StaffDashboard() {
    const router = useRouter();
    const [staffInfo, setStaffInfo] = useState<{ staffId: string; name: string; role: string } | null>(null);
    const [orders, setOrders] = useState(mockOrders);
    const [activeTab, setActiveTab] = useState<OrderStatus>("new");
    const [screenings] = useState<ScreeningBooking[]>(mockScreeningBookings);

    useEffect(() => {
        const staff = localStorage.getItem("staffLoggedIn");
        if (!staff) {
            router.push("/staff-login");
            return;
        }
        setStaffInfo(JSON.parse(staff));
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("staffLoggedIn");
        router.push("/staff-login");
    };

    const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
        setOrders(orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)));
    };

    const getOrdersByStatus = (status: OrderStatus) => orders.filter((order) => order.status === status);

    const statusConfig = {
        new: { icon: Zap, label: "New Orders", color: "text-[#FF6A00]", bg: "bg-[#FF6A00]/10", border: "border-[#FF6A00]/25" },
        preparing: { icon: Clock, label: "Preparing", color: "text-[#CFAF63]", bg: "bg-[#CFAF63]/10", border: "border-[#CFAF63]/25" },
        ready: { icon: CheckCircle, label: "Ready for Pickup", color: "text-[#00D98E]", bg: "bg-[#00D98E]/10", border: "border-[#00D98E]/25" },
        completed: { icon: CheckCircle, label: "Completed", color: "text-[#888]", bg: "bg-[#888]/10", border: "border-[#888]/25" },
    };

    if (!staffInfo) return null;

    const tabs: OrderStatus[] = ["new", "preparing", "ready", "completed"];
    const currentOrders = getOrdersByStatus(activeTab);
    const upcomingScreenings = screenings.filter((s) => s.status === "confirmed" || s.status === "pending");

    const contentIcon: Record<ScreeningBooking["contentType"], string> = {
        "Sports Match": "🏏",
        "Movie": "🎬",
        "Custom Content": "📺",
    };
    const occasionIcon: Record<ScreeningBooking["occasion"], string> = {
        "Birthday": "🎂",
        "Anniversary": "💍",
        "Casual": "😊",
    };

    return (
        <div className="min-h-screen bg-[#0B0B0B] p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <p className="text-sm uppercase tracking-[0.2em] text-[#CFAF63]">Welcome,</p>
                    <h1 className="font-[var(--font-heading)] text-4xl text-[#F5F5F5]">{staffInfo.name}</h1>
                    <p className="text-sm text-[#999] mt-1">Staff ID: {staffInfo.staffId}</p>
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
                    const count = getOrdersByStatus(tab).length;
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

            {/* Orders Grid */}
            <div>
                <h2 className="font-[var(--font-heading)] text-2xl text-[#F5F5F5] mb-4 capitalize">
                    {statusConfig[activeTab].label}
                </h2>

                {currentOrders.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass-card rounded-2xl border border-[#333] p-8 text-center"
                    >
                        <p className="text-[#999]">No {statusConfig[activeTab].label.toLowerCase()} at the moment</p>
                    </motion.div>
                ) : (
                    <motion.div
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        {currentOrders.map((order, idx) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="glass-card rounded-2xl border border-[#CFAF63]/25 p-6 hover:border-[#CFAF63]/50 transition"
                            >
                                {/* Order Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.1em] text-[#CFAF63]">Order #{order.orderNumber}</p>
                                        <p className="text-lg font-semibold text-[#F5F5F5]">{order.customerName}</p>
                                    </div>
                                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusConfig[activeTab].bg} ${statusConfig[activeTab].color}`}>
                                        {order.orderType === "dine-in" ? "🍽️" : order.orderType === "takeaway" ? "🛍️" : "🚗"}
                                        {order.orderType === "dine-in" ? " Dine-in" : order.orderType === "takeaway" ? " Takeaway" : " Delivery"}
                                    </span>
                                </div>

                                {/* Table Info */}
                                {order.tableNumber && (
                                    <p className="text-sm text-[#999] mb-3">Table {order.tableNumber}</p>
                                )}

                                {/* Items */}
                                <div className="bg-[#111]/50 rounded-xl p-3 mb-4 space-y-2">
                                    {order.items.map((item, i) => (
                                        <div key={i} className="flex justify-between text-sm">
                                            <span className="text-[#CCC]">{item.name} x{item.quantity}</span>
                                            <span className="text-[#CFAF63]">₹{item.price * item.quantity}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Total & Time */}
                                <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#333]">
                                    <p className="text-[#999] text-sm">
                                        {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                    <p className="text-lg font-bold text-[#CFAF63]">₹{order.total}</p>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-2">
                                    {activeTab === "new" && (
                                        <button
                                            onClick={() => updateOrderStatus(order.id, "preparing")}
                                            className="w-full py-2 bg-gradient-to-r from-[#CFAF63] to-[#FF6A00] text-[#111] rounded-lg font-semibold hover:shadow-lg transition text-sm"
                                        >
                                            Start Preparing
                                        </button>
                                    )}
                                    {activeTab === "preparing" && (
                                        <button
                                            onClick={() => updateOrderStatus(order.id, "ready")}
                                            className="w-full py-2 bg-gradient-to-r from-[#CFAF63] to-[#FF6A00] text-[#111] rounded-lg font-semibold hover:shadow-lg transition text-sm"
                                        >
                                            Mark Ready
                                        </button>
                                    )}
                                    {activeTab === "ready" && (
                                        <button
                                            onClick={() => updateOrderStatus(order.id, "completed")}
                                            className="w-full py-2 bg-[#00D98E]/20 text-[#00D98E] rounded-lg font-semibold hover:bg-[#00D98E]/30 transition text-sm"
                                        >
                                            Complete Order
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* ─── UPCOMING SCREENING RESERVATIONS ─── */}
            <div className="mt-10">
                <div className="flex items-center gap-2 mb-5">
                    <Monitor size={20} className="text-[#CFAF63]" />
                    <h2 className="font-[var(--font-heading)] text-2xl text-[#F5F5F5]">Upcoming Screening Reservations</h2>
                    <span className="ml-2 rounded-full bg-[#CFAF63]/20 px-2.5 py-0.5 text-xs font-semibold text-[#CFAF63]">
                        {upcomingScreenings.length}
                    </span>
                </div>

                {upcomingScreenings.length === 0 ? (
                    <div className="glass-card rounded-2xl border border-[#333] p-8 text-center text-[#999]">
                        No upcoming screening bookings
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {upcomingScreenings.map((booking, idx) => (
                            <motion.div
                                key={booking.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.06 }}
                                className="glass-card rounded-2xl border border-[#CFAF63]/25 bg-gradient-to-br from-[#0F0D08] to-[#0B0B0B] p-5 hover:border-[#CFAF63]/50 transition"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.12em] text-[#CFAF63]">Private Screening</p>
                                        <p className="text-base font-semibold text-[#F5F5F5] mt-0.5">{booking.name}</p>
                                    </div>
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${booking.status === "confirmed"
                                            ? "bg-[#00D98E]/15 text-[#00D98E]"
                                            : "bg-[#CFAF63]/15 text-[#CFAF63]"
                                        }`}>
                                        {booking.status}
                                    </span>
                                </div>

                                {/* Details */}
                                <div className="space-y-1.5 text-sm text-[#CCC] bg-[#111]/50 rounded-xl p-3 mb-3">
                                    <div className="flex justify-between">
                                        <span className="text-[#999]">Date & Time</span>
                                        <span>{booking.date} · {booking.time}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#999]">Guests</span>
                                        <span>{booking.guests} guest{booking.guests > 1 ? "s" : ""}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#999]">Content</span>
                                        <span>{contentIcon[booking.contentType]} {booking.contentType}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#999]">Occasion</span>
                                        <span>{occasionIcon[booking.occasion]} {booking.occasion}</span>
                                    </div>
                                </div>

                                {/* Special request */}
                                {booking.specialRequest && (
                                    <p className="text-xs text-[#999] italic border-t border-[#CFAF63]/10 pt-3">
                                        &ldquo;{booking.specialRequest}&rdquo;
                                    </p>
                                )}

                                {/* Phone */}
                                <p className="mt-2 text-xs text-[#666]">📞 {booking.phone}</p>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
