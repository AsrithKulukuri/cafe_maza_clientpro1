"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut, BarChart3, ShoppingCart, UtensilsCrossed, Calendar, Plus, Trash2, Edit2, Monitor } from "lucide-react";
import { mockOrders, mockAnalytics, mockReservations, mockScreeningBookings, menuCategories, type MenuCategory, type ScreeningBooking } from "@/data/mockData";

type TabType = "analytics" | "orders" | "menu" | "reservations" | "screenings";

export default function AdminDashboard() {
    const router = useRouter();
    const [adminInfo, setAdminInfo] = useState<{ adminEmail: string; name: string; email: string } | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>("analytics");
    const [newMenuItem, setNewMenuItem] = useState({ name: "", category: "soups", price: "", image: "", isVeg: true });
    const [showNewMenuForm, setShowNewMenuForm] = useState(false);
    const [orders, setOrders] = useState(mockOrders);
    const [managedMenu, setManagedMenu] = useState<MenuCategory[]>(menuCategories);
    const [screeningBookings, setScreeningBookings] = useState<ScreeningBooking[]>(mockScreeningBookings);

    const updateScreeningStatus = (id: string, status: ScreeningBooking["status"]) => {
        setScreeningBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    };

    useEffect(() => {
        const admin = localStorage.getItem("adminLoggedIn");
        if (!admin) {
            router.push("/admin-login");
            return;
        }
        setAdminInfo(JSON.parse(admin));
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("adminLoggedIn");
        router.push("/admin-login");
    };

    const handleAddMenuItem = () => {
        if (newMenuItem.name && newMenuItem.price && newMenuItem.image) {
            const targetCategory = newMenuItem.category === "main" ? "main-course" : newMenuItem.category;
            setManagedMenu((prev) =>
                prev.map((category) =>
                    category.id === targetCategory
                        ? {
                            ...category,
                            items: [
                                ...category.items,
                                { name: newMenuItem.name, price: Number(newMenuItem.price), image: newMenuItem.image },
                            ],
                        }
                        : category
                )
            );
            setNewMenuItem({ name: "", category: "soups", price: "", image: "", isVeg: true });
            setShowNewMenuForm(false);
        }
    };

    const updateOrderStatus = (orderId: string, status: "new" | "preparing" | "ready" | "completed" | "cancelled") => {
        setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status } : order)));
    };

    const deleteMenuItem = (categoryId: string, itemIdx: number) => {
        setManagedMenu((prev) =>
            prev.map((category) =>
                category.id === categoryId
                    ? { ...category, items: category.items.filter((_, idx) => idx !== itemIdx) }
                    : category
            )
        );
    };

    const editMenuItemPrice = (categoryId: string, itemIdx: number, currentPrice: number) => {
        const input = window.prompt("Update item price", String(currentPrice));
        if (!input) return;
        const nextPrice = Number(input);
        if (Number.isNaN(nextPrice) || nextPrice <= 0) return;

        setManagedMenu((prev) =>
            prev.map((category) =>
                category.id === categoryId
                    ? {
                        ...category,
                        items: category.items.map((item, idx) =>
                            idx === itemIdx ? { ...item, price: nextPrice } : item
                        ),
                    }
                    : category
            )
        );
    };

    if (!adminInfo) return null;

    const tabs = [
        { id: "analytics", label: "Analytics", icon: BarChart3 },
        { id: "orders", label: "Orders", icon: ShoppingCart },
        { id: "menu", label: "Menu", icon: UtensilsCrossed },
        { id: "reservations", label: "Reservations", icon: Calendar },
        { id: "screenings", label: "Screenings", icon: Monitor },
    ];

    return (
        <div className="min-h-screen bg-[#0B0B0B] p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <p className="text-sm uppercase tracking-[0.2em] text-[#CFAF63]">Welcome,</p>
                    <h1 className="font-[var(--font-heading)] text-4xl text-[#F5F5F5]">{adminInfo.name}</h1>
                    <p className="text-sm text-[#999] mt-1">{adminInfo.email}</p>
                </motion.div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF6A00]/20 text-[#FF6A00] hover:bg-[#FF6A00]/30 transition"
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <motion.button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            whileHover={{ scale: 1.05 }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition ${activeTab === tab.id
                                ? "bg-gradient-to-r from-[#CFAF63] to-[#FF6A00] text-[#111] font-semibold"
                                : "border border-[#CFAF63]/25 text-[#F5F5F5] hover:border-[#CFAF63]"
                                }`}
                        >
                            <Icon size={18} />
                            {tab.label}
                        </motion.button>
                    );
                })}
            </div>

            {/* Content Sections */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                {/* ANALYTICS TAB */}
                {activeTab === "analytics" && (
                    <div className="space-y-6">
                        {/* Analytics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {[
                                { label: "Total Orders Today", value: mockAnalytics.totalOrdersToday, icon: "📊", color: "from-[#FF6A00]" },
                                { label: "Revenue Today", value: `₹${mockAnalytics.revenueToday}`, icon: "💰", color: "from-[#CFAF63]" },
                                { label: "Active Orders", value: mockAnalytics.activeOrders, icon: "🔄", color: "from-[#3B82F6]" },
                                { label: "Reservations", value: mockAnalytics.reservationsToday, icon: "🗓️", color: "from-[#00D98E]" },
                                { label: "Screening Bookings", value: screeningBookings.length, icon: "🎬", color: "from-[#8B5CF6]" },
                            ].map((card, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={`glass-card rounded-2xl border border-[#CFAF63]/25 p-6 bg-gradient-to-br ${card.color}/5`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[#999] text-sm">{card.label}</p>
                                            <p className="text-3xl font-bold text-[#F5F5F5] mt-2">{card.value}</p>
                                        </div>
                                        <span className="text-4xl">{card.icon}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Orders Per Hour */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="glass-card rounded-2xl border border-[#CFAF63]/25 p-6"
                            >
                                <h3 className="font-[var(--font-heading)] text-xl text-[#F5F5F5] mb-4">Orders Per Hour</h3>
                                <div className="space-y-3">
                                    {mockAnalytics.ordersPerHour.map((data, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <span className="text-[#999] w-12 text-sm">{data.time}</span>
                                            <div className="flex-1 bg-[#1A1A1A] rounded-full h-2 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(data.orders / 9) * 100}%` }}
                                                    transition={{ delay: idx * 0.05, duration: 0.8 }}
                                                    className="h-full bg-gradient-to-r from-[#CFAF63] to-[#FF6A00]"
                                                />
                                            </div>
                                            <span className="text-[#CFAF63] w-8 text-right">{data.orders}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Revenue Chart */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="glass-card rounded-2xl border border-[#CFAF63]/25 p-6"
                            >
                                <h3 className="font-[var(--font-heading)] text-xl text-[#F5F5F5] mb-4">Revenue Trend</h3>
                                <div className="space-y-3">
                                    {mockAnalytics.revenueChart.map((data, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <span className="text-[#999] w-12 text-sm">{data.time}</span>
                                            <div className="flex-1 bg-[#1A1A1A] rounded-full h-2 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(data.revenue / 2700) * 100}%` }}
                                                    transition={{ delay: idx * 0.05, duration: 0.8 }}
                                                    className="h-full bg-gradient-to-r from-[#CFAF63] to-[#00D98E]"
                                                />
                                            </div>
                                            <span className="text-[#CFAF63] w-16 text-right">₹{data.revenue}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}

                {/* ORDERS TAB */}
                {activeTab === "orders" && (
                    <div className="glass-card rounded-2xl border border-[#CFAF63]/25 p-6 overflow-x-auto">
                        <h3 className="font-[var(--font-heading)] text-xl text-[#F5F5F5] mb-4">Order Management</h3>
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#333]">
                                    <th className="text-left py-3 px-4 text-[#999] text-sm font-semibold">Order ID</th>
                                    <th className="text-left py-3 px-4 text-[#999] text-sm font-semibold">Customer</th>
                                    <th className="text-left py-3 px-4 text-[#999] text-sm font-semibold">Items</th>
                                    <th className="text-left py-3 px-4 text-[#999] text-sm font-semibold">Status</th>
                                    <th className="text-right py-3 px-4 text-[#999] text-sm font-semibold">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id} className="border-b border-[#1A1A1A] hover:bg-[#111]/50 transition">
                                        <td className="py-3 px-4 text-[#CFAF63]">#{order.orderNumber}</td>
                                        <td className="py-3 px-4 text-[#F5F5F5]">{order.customerName}</td>
                                        <td className="py-3 px-4 text-[#CCC] text-sm">{order.items.map((i) => i.name).join(", ")}</td>
                                        <td className="py-3 px-4">
                                            <select
                                                value={order.status}
                                                onChange={(e) => updateOrderStatus(order.id, e.target.value as "new" | "preparing" | "ready" | "completed" | "cancelled")}
                                                className="rounded-md border border-[#CFAF63]/30 bg-[#171717] px-2 py-1 text-xs text-[#F5F5F5]"
                                            >
                                                <option value="new">new</option>
                                                <option value="preparing">preparing</option>
                                                <option value="ready">ready</option>
                                                <option value="completed">completed</option>
                                                <option value="cancelled">cancelled</option>
                                            </select>
                                        </td>
                                        <td className="py-3 px-4 text-right text-[#F5F5F5] font-semibold">₹{order.total}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* MENU TAB */}
                {activeTab === "menu" && (
                    <div className="space-y-6">
                        <motion.button
                            onClick={() => setShowNewMenuForm(!showNewMenuForm)}
                            whileHover={{ scale: 1.05 }}
                            className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#CFAF63] to-[#FF6A00] text-[#111] font-semibold hover:shadow-lg transition"
                        >
                            <Plus size={18} />
                            Add New Item
                        </motion.button>

                        {/* Add Menu Form */}
                        {showNewMenuForm && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="glass-card rounded-2xl border border-[#CFAF63]/25 p-6"
                            >
                                <h3 className="font-[var(--font-heading)] text-lg text-[#F5F5F5] mb-4">Add New Menu Item</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        placeholder="Item Name"
                                        value={newMenuItem.name}
                                        onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                                        className="rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3 text-[#F5F5F5] placeholder-[#666] focus:outline-none"
                                    />
                                    <select
                                        value={newMenuItem.category}
                                        onChange={(e) => setNewMenuItem({ ...newMenuItem, category: e.target.value })}
                                        className="rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3 text-[#F5F5F5] focus:outline-none"
                                    >
                                        <option value="soups">Soups</option>
                                        <option value="starters">Chinese Starters</option>
                                        <option value="tandoori">Tandoori</option>
                                        <option value="main">Main Course</option>
                                        <option value="biryani">Biryani</option>
                                        <option value="desserts">Desserts</option>
                                    </select>
                                    <input
                                        type="number"
                                        placeholder="Price (₹)"
                                        value={newMenuItem.price}
                                        onChange={(e) => setNewMenuItem({ ...newMenuItem, price: e.target.value })}
                                        className="rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3 text-[#F5F5F5] placeholder-[#666] focus:outline-none"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Image URL or /images/item.jpg"
                                        value={newMenuItem.image}
                                        onChange={(e) => setNewMenuItem({ ...newMenuItem, image: e.target.value })}
                                        className="rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3 text-[#F5F5F5] placeholder-[#666] focus:outline-none"
                                    />
                                    <label className="flex items-center gap-2 px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={newMenuItem.isVeg}
                                            onChange={(e) => setNewMenuItem({ ...newMenuItem, isVeg: e.target.checked })}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-[#F5F5F5]">Vegetarian</span>
                                    </label>
                                </div>
                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={handleAddMenuItem}
                                        className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#CFAF63] to-[#FF6A00] text-[#111] font-semibold hover:shadow-lg transition text-sm"
                                    >
                                        Save Item
                                    </button>
                                    <button
                                        onClick={() => setShowNewMenuForm(false)}
                                        className="px-6 py-2 rounded-lg border border-[#CFAF63]/25 text-[#F5F5F5] hover:bg-[#1A1A1A] transition text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Menu Categories */}
                        <div className="space-y-4">
                            {managedMenu.slice(0, 4).map((category, idx) => (
                                <motion.div
                                    key={category.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="glass-card rounded-2xl border border-[#CFAF63]/25 p-6"
                                >
                                    <h3 className="font-[var(--font-heading)] text-lg text-[#F5F5F5] mb-4 capitalize">{category.label}</h3>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {category.items.map((item, itemIdx) => (
                                            <div key={itemIdx} className="flex items-center justify-between py-2 px-3 bg-[#111]/50 rounded-lg">
                                                <div className="flex-1">
                                                    <p className="text-[#F5F5F5] text-sm">{item.name}</p>
                                                    <p className="text-[#999] text-xs">₹{item.price}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => editMenuItemPrice(category.id, itemIdx, item.price)} className="p-1 rounded hover:bg-[#CFAF63]/20 transition">
                                                        <Edit2 size={14} className="text-[#CFAF63]" />
                                                    </button>
                                                    <button onClick={() => deleteMenuItem(category.id, itemIdx)} className="p-1 rounded hover:bg-[#FF6A00]/20 transition">
                                                        <Trash2 size={14} className="text-[#FF6A00]" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* RESERVATIONS TAB */}
                {activeTab === "reservations" && (
                    <div className="glass-card rounded-2xl border border-[#CFAF63]/25 p-6 overflow-x-auto">
                        <h3 className="font-[var(--font-heading)] text-xl text-[#F5F5F5] mb-4">Reservation Management</h3>
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#333]">
                                    <th className="text-left py-3 px-4 text-[#999] text-sm font-semibold">Customer Name</th>
                                    <th className="text-left py-3 px-4 text-[#999] text-sm font-semibold">Phone</th>
                                    <th className="text-left py-3 px-4 text-[#999] text-sm font-semibold">Guests</th>
                                    <th className="text-left py-3 px-4 text-[#999] text-sm font-semibold">Date</th>
                                    <th className="text-left py-3 px-4 text-[#999] text-sm font-semibold">Time</th>
                                    <th className="text-left py-3 px-4 text-[#999] text-sm font-semibold">Table</th>
                                    <th className="text-left py-3 px-4 text-[#999] text-sm font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mockReservations.map((res) => (
                                    <tr key={res.id} className="border-b border-[#1A1A1A] hover:bg-[#111]/50 transition">
                                        <td className="py-3 px-4 text-[#F5F5F5]">{res.name}</td>
                                        <td className="py-3 px-4 text-[#CCC] text-sm">{res.phone}</td>
                                        <td className="py-3 px-4 text-[#CCC]">{res.guests}</td>
                                        <td className="py-3 px-4 text-[#CCC] text-sm">{res.date}</td>
                                        <td className="py-3 px-4 text-[#CCC] text-sm">{res.time}</td>
                                        <td className="py-3 px-4 text-[#CFAF63] font-semibold">#{res.tableNumber}</td>
                                        <td className="py-3 px-4">
                                            <span className="text-xs px-2 py-1 rounded-full bg-[#00D98E]/20 text-[#00D98E] font-semibold">
                                                confirmed
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* SCREENINGS TAB */}
                {activeTab === "screenings" && (
                    <div className="space-y-6">
                        {/* Summary cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {(["pending", "confirmed", "completed", "cancelled"] as const).map((s) => {
                                const count = screeningBookings.filter((b) => b.status === s).length;
                                const cfg = {
                                    pending: { color: "text-[#CFAF63]", bg: "from-[#CFAF63]/10", icon: "⏳" },
                                    confirmed: { color: "text-[#00D98E]", bg: "from-[#00D98E]/10", icon: "✅" },
                                    completed: { color: "text-[#888]", bg: "from-[#888]/10", icon: "🎬" },
                                    cancelled: { color: "text-[#FF6A00]", bg: "from-[#FF6A00]/10", icon: "❌" },
                                }[s];
                                return (
                                    <div key={s} className={`glass-card rounded-2xl border border-[#CFAF63]/20 p-5 bg-gradient-to-br ${cfg.bg} to-transparent`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[#999] text-xs capitalize">{s}</p>
                                                <p className={`text-3xl font-bold mt-1 ${cfg.color}`}>{count}</p>
                                            </div>
                                            <span className="text-2xl">{cfg.icon}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Booking table */}
                        <div className="glass-card rounded-2xl border border-[#CFAF63]/25 p-6 overflow-x-auto">
                            <h3 className="font-[var(--font-heading)] text-xl text-[#F5F5F5] mb-4 flex items-center gap-2">
                                <Monitor size={20} className="text-[#CFAF63]" />
                                Screening Booking Management
                            </h3>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[#333]">
                                        {["Name", "Phone", "Date & Time", "Guests", "Occasion", "Content", "Special Request", "Status"].map((h) => (
                                            <th key={h} className="text-left py-3 px-4 text-[#999] text-xs font-semibold whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {screeningBookings.map((b) => (
                                        <tr key={b.id} className="border-b border-[#1A1A1A] hover:bg-[#111]/60 transition">
                                            <td className="py-3 px-4 text-[#F5F5F5] font-medium whitespace-nowrap">{b.name}</td>
                                            <td className="py-3 px-4 text-[#CCC]">{b.phone}</td>
                                            <td className="py-3 px-4 text-[#CCC] whitespace-nowrap">{b.date} {b.time}</td>
                                            <td className="py-3 px-4 text-[#CCC] text-center">{b.guests}</td>
                                            <td className="py-3 px-4">
                                                <span className="rounded-full border border-[#CFAF63]/25 px-2 py-0.5 text-xs text-[#CFAF63]">{b.occasion}</span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="rounded-full bg-[#3B82F6]/15 px-2 py-0.5 text-xs text-[#6CA3EA]">{b.contentType}</span>
                                            </td>
                                            <td className="py-3 px-4 text-[#999] max-w-[140px] truncate" title={b.specialRequest}>{b.specialRequest || "—"}</td>
                                            <td className="py-3 px-4">
                                                <select
                                                    value={b.status}
                                                    onChange={(e) => updateScreeningStatus(b.id, e.target.value as ScreeningBooking["status"])}
                                                    className="rounded-md border border-[#CFAF63]/30 bg-[#171717] px-2 py-1 text-xs text-[#F5F5F5] focus:outline-none"
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="confirmed">Confirmed</option>
                                                    <option value="completed">Completed</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
