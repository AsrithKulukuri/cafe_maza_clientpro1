"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut, BarChart3, ShoppingCart, UtensilsCrossed, Calendar, Plus, Trash2, Edit2, Monitor, Truck, User } from "lucide-react";
import { mockOrders, mockAnalytics, mockReservations, mockScreeningBookings, type ScreeningBooking } from "@/data/mockData";
import { apiFetch } from "@/lib/api";
import { clearAuthSession, getAuthToken, getAuthUser } from "@/lib/authToken";
import { socket } from "@/lib/socket";
import { StaffUsersPanel } from "@/components/admin/StaffUsersPanel";

type TabType = "analytics" | "orders" | "menu" | "deliveryPartners" | "staffUsers" | "reservations" | "screenings";

type AdminMenuItem = {
    _id: string;
    name: string;
    category: string;
    price: number;
    image: string;
    isVeg: boolean;
    isPopular?: boolean;
    isBestSeller?: boolean;
    isSoldOut?: boolean;
    tags?: string[];
};

type DeliveryPartner = {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    deliveryProfile?: {
        vehicleNumber?: string;
        licenseNumber?: string;
        isActive?: boolean;
    };
    createdAt?: string;
};

export default function AdminDashboard() {
    const router = useRouter();
    const [adminInfo, setAdminInfo] = useState<{ adminEmail: string; name: string; email: string } | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>("analytics");
    const [newMenuItem, setNewMenuItem] = useState({
        name: "",
        category: "soups",
        price: "",
        image: "",
        isVeg: true,
        isPopular: false,
        isBestSeller: false,
        isSoldOut: false,
        tagsText: "",
    });
    const [showNewMenuForm, setShowNewMenuForm] = useState(false);
    const [menuItems, setMenuItems] = useState<AdminMenuItem[]>([]);
    const [menuSaving, setMenuSaving] = useState(false);
    const [menuError, setMenuError] = useState("");
    const [uploadingImage, setUploadingImage] = useState(false);
    const [updatingImageId, setUpdatingImageId] = useState<string | null>(null);
    const rowImageInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>([]);
    const [showDeliveryPartnerForm, setShowDeliveryPartnerForm] = useState(false);
    const [deliveryPartnerSaving, setDeliveryPartnerSaving] = useState(false);
    const [deliveryPartnerError, setDeliveryPartnerError] = useState("");
    const [newDeliveryPartner, setNewDeliveryPartner] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        vehicleNumber: "",
        licenseNumber: "",
    });
    const [orders, setOrders] = useState(mockOrders);
    const [screeningBookings, setScreeningBookings] = useState<ScreeningBooking[]>(mockScreeningBookings);
    const [reservations, setReservations] = useState(mockReservations);
    const [analytics, setAnalytics] = useState({
        totalOrdersToday: mockAnalytics.totalOrdersToday,
        revenueToday: mockAnalytics.revenueToday,
        activeOrders: mockAnalytics.activeOrders,
        reservationsToday: mockAnalytics.reservationsToday,
    });

    const updateScreeningStatus = (id: string, status: ScreeningBooking["status"]) => {
        setScreeningBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    };

    useEffect(() => {
        const user = getAuthUser();
        if (!user || user.role !== "admin") {
            router.push("/admin-login");
            return;
        }
        setAdminInfo({ adminEmail: user.email, name: user.name, email: user.email });
    }, [router]);

    useEffect(() => {
        async function loadDashboardData() {
            const token = getAuthToken();
            if (!token) return;

            try {
                const [analyticsRes, ordersRes, menuRes, reservationsRes, screeningRes, deliveryPartnersRes] = await Promise.all([
                    apiFetch<{ totalOrders: number; revenue: number; activeOrders: number; reservations: number }>("/api/admin/analytics", { token }),
                    apiFetch<Array<{ _id: string; totalAmount: number; status: string; createdAt: string; userId?: { name?: string }; items: Array<{ quantity: number; menuItemId?: { name?: string; price?: number } }> }>>("/api/orders", { token }),
                    apiFetch<AdminMenuItem[]>("/api/menu"),
                    apiFetch<typeof mockReservations>("/api/reservations", { token }),
                    apiFetch<ScreeningBooking[]>("/api/screening", { token }),
                    apiFetch<DeliveryPartner[]>("/api/admin/delivery-partners", { token }),
                ]);

                setAnalytics({
                    totalOrdersToday: analyticsRes.totalOrders,
                    revenueToday: analyticsRes.revenue,
                    activeOrders: analyticsRes.activeOrders,
                    reservationsToday: analyticsRes.reservations,
                });

                setOrders(
                    ordersRes.map((order, index) => ({
                        id: order._id,
                        orderNumber: index + 1000,
                        customerName: order.userId?.name || "Customer",
                        customerPhone: "N/A",
                        items: order.items.map((item) => ({
                            name: item.menuItemId?.name || "Item",
                            quantity: item.quantity,
                            price: item.menuItemId?.price || 0,
                        })),
                        status:
                            order.status === "placed"
                                ? "new"
                                : order.status === "out_for_delivery" || order.status === "delivered"
                                    ? "completed"
                                    : (order.status as "new" | "preparing" | "ready" | "completed" | "cancelled"),
                        total: order.totalAmount,
                        orderType: "delivery",
                        createdAt: new Date(order.createdAt),
                    }))
                );

                setMenuItems(menuRes);

                setReservations(reservationsRes);
                setScreeningBookings(screeningRes);
                setDeliveryPartners(deliveryPartnersRes);
            } catch {
                // Keep local fallback data.
            }
        }

        loadDashboardData();

        if (!socket.connected) {
            socket.connect();
        }

        const handleOrderChanged = () => {
            loadDashboardData();
        };

        socket.on("order_created", handleOrderChanged);
        socket.on("order_status_updated", handleOrderChanged);

        return () => {
            socket.off("order_created", handleOrderChanged);
            socket.off("order_status_updated", handleOrderChanged);
        };
    }, []);

    const handleLogout = () => {
        clearAuthSession();
        router.push("/admin-login");
    };

    const handleAddMenuItem = async () => {
        if (!newMenuItem.name || !newMenuItem.price || !newMenuItem.image) {
            setMenuError("Name, price and image are required");
            return;
        }

        const token = getAuthToken();
        if (!token) {
            setMenuError("Admin session expired. Please login again.");
            return;
        }

        setMenuSaving(true);
        setMenuError("");

        try {
            const tags = newMenuItem.tagsText
                .split(",")
                .map((tag) => tag.trim().toLowerCase())
                .filter(Boolean);

            const created = await apiFetch<AdminMenuItem>("/api/menu", {
                method: "POST",
                token,
                body: JSON.stringify({
                    name: newMenuItem.name,
                    category: newMenuItem.category,
                    price: Number(newMenuItem.price),
                    image: newMenuItem.image,
                    isVeg: newMenuItem.isVeg,
                    isPopular: newMenuItem.isPopular,
                    isBestSeller: newMenuItem.isBestSeller,
                    isSoldOut: newMenuItem.isSoldOut,
                    tags,
                }),
            });

            setMenuItems((prev) => [created, ...prev]);
            setNewMenuItem({
                name: "",
                category: "soups",
                price: "",
                image: "",
                isVeg: true,
                isPopular: false,
                isBestSeller: false,
                isSoldOut: false,
                tagsText: "",
            });
            setShowNewMenuForm(false);
        } catch (error) {
            setMenuError(error instanceof Error ? error.message : "Failed to create menu item");
        } finally {
            setMenuSaving(false);
        }
    };

    const updateOrderStatus = (orderId: string, status: "new" | "preparing" | "ready" | "completed" | "cancelled") => {
        setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status } : order)));

        const token = getAuthToken();
        if (!token) return;

        const backendStatus = status === "new" ? "placed" : status === "completed" ? "delivered" : status;

        apiFetch(`/api/orders/${orderId}/status`, {
            method: "PUT",
            token,
            body: JSON.stringify({ status: backendStatus }),
        }).catch(() => undefined);
    };

    const updateMenuItem = async (id: string, patch: Partial<AdminMenuItem>) => {
        const token = getAuthToken();

        if (!token) {
            setMenuError("Admin session expired. Please login again.");
            return;
        }

        try {
            const updated = await apiFetch<AdminMenuItem>(`/api/menu/${id}`, {
                method: "PUT",
                token,
                body: JSON.stringify(patch),
            });

            setMenuItems((prev) => prev.map((item) => (item._id === id ? updated : item)));
        } catch (error) {
            setMenuError(error instanceof Error ? error.message : "Failed to update menu item");
        }
    };

    const deleteMenuItem = async (id: string) => {
        const token = getAuthToken();
        if (!token) {
            setMenuError("Admin session expired. Please login again.");
            return;
        }

        try {
            await apiFetch(`/api/menu/${id}`, {
                method: "DELETE",
                token,
            });
            setMenuItems((prev) => prev.filter((item) => item._id !== id));
        } catch (error) {
            setMenuError(error instanceof Error ? error.message : "Failed to delete menu item");
        }
    };

    const editMenuItemPrice = (id: string, currentPrice: number) => {
        const input = window.prompt("Update item price", String(currentPrice));
        if (!input) return;
        const nextPrice = Number(input);
        if (Number.isNaN(nextPrice) || nextPrice <= 0) return;

        updateMenuItem(id, { price: nextPrice });
    };

    const editMenuItemTags = (item: AdminMenuItem) => {
        const input = window.prompt("Update tags (comma separated)", (item.tags || []).join(", "));
        if (input === null) return;

        const tags = input
            .split(",")
            .map((tag) => tag.trim().toLowerCase())
            .filter(Boolean);

        updateMenuItem(item._id, { tags });
    };

    const uploadImageFile = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/menu/upload-image", {
            method: "POST",
            body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Image upload failed");
        }

        return result.publicUrl as string;
    };

    const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        setMenuError("");

        try {
            const publicUrl = await uploadImageFile(file);
            setNewMenuItem((prev) => ({ ...prev, image: publicUrl }));
        } catch (error) {
            setMenuError(error instanceof Error ? error.message : "Image upload failed");
        } finally {
            setUploadingImage(false);
        }
    };

    const handleReplaceItemImage = async (id: string, event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUpdatingImageId(id);
        setMenuError("");

        try {
            const publicUrl = await uploadImageFile(file);
            await updateMenuItem(id, { image: publicUrl });
        } catch (error) {
            setMenuError(error instanceof Error ? error.message : "Image update failed");
        } finally {
            if (event.target) {
                event.target.value = "";
            }
            setUpdatingImageId(null);
        }
    };

    const editMenuItemImageUrl = (item: AdminMenuItem) => {
        const input = window.prompt("Update image URL", item.image || "");
        if (input === null) return;

        const nextImage = input.trim();
        if (!nextImage) return;

        updateMenuItem(item._id, { image: nextImage });
    };

    const handleAddDeliveryPartner = async () => {
        const token = getAuthToken();
        if (!token) {
            setDeliveryPartnerError("Admin session expired. Please login again.");
            return;
        }

        if (!newDeliveryPartner.name || !newDeliveryPartner.email || !newDeliveryPartner.password) {
            setDeliveryPartnerError("Name, email and password are required");
            return;
        }

        setDeliveryPartnerSaving(true);
        setDeliveryPartnerError("");

        try {
            const created = await apiFetch<DeliveryPartner>("/api/admin/delivery-partners", {
                method: "POST",
                token,
                body: JSON.stringify(newDeliveryPartner),
            });

            setDeliveryPartners((prev) => [created, ...prev]);
            setNewDeliveryPartner({
                name: "",
                email: "",
                phone: "",
                password: "",
                vehicleNumber: "",
                licenseNumber: "",
            });
            setShowDeliveryPartnerForm(false);
        } catch (requestError) {
            setDeliveryPartnerError(requestError instanceof Error ? requestError.message : "Failed to add delivery partner");
        } finally {
            setDeliveryPartnerSaving(false);
        }
    };

    const toggleDeliveryPartner = async (partner: DeliveryPartner, isActive: boolean) => {
        const token = getAuthToken();
        if (!token) return;

        try {
            const updated = await apiFetch<DeliveryPartner>(`/api/admin/delivery-partners/${partner._id}`, {
                method: "PUT",
                token,
                body: JSON.stringify({ isActive }),
            });

            setDeliveryPartners((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
        } catch (requestError) {
            setDeliveryPartnerError(requestError instanceof Error ? requestError.message : "Failed to update partner");
        }
    };

    if (!adminInfo) return null;

    const tabs = [
        { id: "analytics", label: "Analytics", icon: BarChart3 },
        { id: "orders", label: "Orders", icon: ShoppingCart },
        { id: "menu", label: "Menu", icon: UtensilsCrossed },
        { id: "deliveryPartners", label: "Delivery Partners", icon: Truck },
        { id: "staffUsers", label: "Staff Users", icon: User },
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
                                { label: "Total Orders Today", value: analytics.totalOrdersToday, icon: "📊", color: "from-[#FF6A00]" },
                                { label: "Revenue Today", value: `₹${analytics.revenueToday}`, icon: "💰", color: "from-[#CFAF63]" },
                                { label: "Active Orders", value: analytics.activeOrders, icon: "🔄", color: "from-[#3B82F6]" },
                                { label: "Reservations", value: analytics.reservationsToday, icon: "🗓️", color: "from-[#00D98E]" },
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
                                {orders.map((order, index) => (
                                    <tr key={`${order.id || `order-${order.orderNumber}`}-${index}`} className="border-b border-[#1A1A1A] hover:bg-[#111]/50 transition">
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
                                        placeholder="Image URL"
                                        value={newMenuItem.image}
                                        onChange={(e) => setNewMenuItem({ ...newMenuItem, image: e.target.value })}
                                        className="rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3 text-[#F5F5F5] placeholder-[#666] focus:outline-none"
                                    />
                                    <label className="rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3 text-[#F5F5F5]">
                                        <span className="text-xs text-[#999]">Upload dish photo (Supabase)</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="mt-2 block w-full text-sm"
                                        />
                                        <span className="mt-1 block text-xs text-[#999]">
                                            {uploadingImage ? "Uploading..." : "Max size 5MB"}
                                        </span>
                                    </label>
                                    <label className="flex items-center gap-2 px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={newMenuItem.isVeg}
                                            onChange={(e) => setNewMenuItem({ ...newMenuItem, isVeg: e.target.checked })}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-[#F5F5F5]">Vegetarian</span>
                                    </label>
                                    <label className="flex items-center gap-2 px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={newMenuItem.isPopular}
                                            onChange={(e) => setNewMenuItem({ ...newMenuItem, isPopular: e.target.checked })}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-[#F5F5F5]">Show on Home</span>
                                    </label>
                                    <label className="flex items-center gap-2 px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={newMenuItem.isBestSeller}
                                            onChange={(e) => setNewMenuItem({ ...newMenuItem, isBestSeller: e.target.checked })}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-[#F5F5F5]">Most Selling</span>
                                    </label>
                                    <label className="flex items-center gap-2 px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={newMenuItem.isSoldOut}
                                            onChange={(e) => setNewMenuItem({ ...newMenuItem, isSoldOut: e.target.checked })}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-[#F5F5F5]">Sold Out</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Tags (comma separated: spicy, chef-special, new)"
                                        value={newMenuItem.tagsText}
                                        onChange={(e) => setNewMenuItem({ ...newMenuItem, tagsText: e.target.value })}
                                        className="rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3 text-[#F5F5F5] placeholder-[#666] focus:outline-none md:col-span-2"
                                    />
                                </div>
                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={handleAddMenuItem}
                                        disabled={menuSaving || uploadingImage}
                                        className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#CFAF63] to-[#FF6A00] text-[#111] font-semibold hover:shadow-lg transition text-sm"
                                    >
                                        {menuSaving ? "Saving..." : "Save Item"}
                                    </button>
                                    <button
                                        onClick={() => setShowNewMenuForm(false)}
                                        className="px-6 py-2 rounded-lg border border-[#CFAF63]/25 text-[#F5F5F5] hover:bg-[#1A1A1A] transition text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                                {menuError ? <p className="mt-3 text-sm text-rose-300">{menuError}</p> : null}
                            </motion.div>
                        )}

                        {/* Managed Menu List */}
                        <div className="glass-card rounded-2xl border border-[#CFAF63]/25 p-6 overflow-x-auto">
                            <h3 className="font-[var(--font-heading)] text-lg text-[#F5F5F5] mb-4">All Menu Items</h3>
                            {menuError ? <p className="mb-3 text-sm text-rose-300">{menuError}</p> : null}
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[#333]">
                                        <th className="py-2 px-3 text-left text-[#999]">Dish</th>
                                        <th className="py-2 px-3 text-left text-[#999]">Category</th>
                                        <th className="py-2 px-3 text-left text-[#999]">Price</th>
                                        <th className="py-2 px-3 text-left text-[#999]">Tags</th>
                                        <th className="py-2 px-3 text-left text-[#999]">Status</th>
                                        <th className="py-2 px-3 text-right text-[#999]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {menuItems.map((item, index) => (
                                        <tr key={`${item._id || `menu-item-${item.name}`}-${index}`} className="border-b border-[#1A1A1A] align-top">
                                            <td className="py-3 px-3">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={item.image || "/images/soup.jpg"}
                                                        alt={item.name}
                                                        className="h-12 w-12 rounded-lg object-cover"
                                                        onError={(event) => {
                                                            event.currentTarget.src = "/images/soup.jpg";
                                                        }}
                                                    />
                                                    <div>
                                                        <p className="text-[#F5F5F5] font-medium">{item.name}</p>
                                                        <p className="text-[#999] text-xs">{item.isVeg ? "Veg" : "Non Veg"}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3 text-[#CCC]">{item.category}</td>
                                            <td className="py-3 px-3 text-[#CFAF63]">₹{item.price}</td>
                                            <td className="py-3 px-3">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {item.isPopular ? <span className="rounded-full bg-[#00D98E]/20 px-2 py-0.5 text-xs text-[#4FE0A6]">Home</span> : null}
                                                    {item.isBestSeller ? <span className="rounded-full bg-[#FF6A00]/20 px-2 py-0.5 text-xs text-[#FF6A00]">Most Selling</span> : null}
                                                    {item.isSoldOut ? <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs text-rose-300">Sold Out</span> : null}
                                                    {(item.tags || []).map((tag, tagIndex) => (
                                                        <span key={`${item._id || item.name}-${tag}-${tagIndex}`} className="rounded-full bg-[#3B82F6]/20 px-2 py-0.5 text-xs text-[#6CA3EA]">{tag}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="py-3 px-3">
                                                <label className="flex items-center gap-2 text-xs text-[#CCC]">
                                                    <input
                                                        type="checkbox"
                                                        checked={Boolean(item.isPopular)}
                                                        onChange={(event) => updateMenuItem(item._id, { isPopular: event.target.checked })}
                                                    />
                                                    Show on Home
                                                </label>
                                                <label className="mt-1 flex items-center gap-2 text-xs text-[#CCC]">
                                                    <input
                                                        type="checkbox"
                                                        checked={Boolean(item.isBestSeller)}
                                                        onChange={(event) => updateMenuItem(item._id, { isBestSeller: event.target.checked })}
                                                    />
                                                    Most Selling
                                                </label>
                                                <label className="mt-1 flex items-center gap-2 text-xs text-[#CCC]">
                                                    <input
                                                        type="checkbox"
                                                        checked={Boolean(item.isSoldOut)}
                                                        onChange={(event) => updateMenuItem(item._id, { isSoldOut: event.target.checked })}
                                                    />
                                                    Sold Out
                                                </label>
                                                <label className="mt-1 flex items-center gap-2 text-xs text-[#CCC]">
                                                    <input
                                                        type="checkbox"
                                                        checked={Boolean(item.isVeg)}
                                                        onChange={(event) => updateMenuItem(item._id, { isVeg: event.target.checked })}
                                                    />
                                                    Veg
                                                </label>
                                            </td>
                                            <td className="py-3 px-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => editMenuItemPrice(item._id, item.price)}
                                                        className="p-1 rounded hover:bg-[#CFAF63]/20 transition"
                                                        title="Edit Price"
                                                    >
                                                        <Edit2 size={14} className="text-[#CFAF63]" />
                                                    </button>
                                                    <button
                                                        onClick={() => editMenuItemTags(item)}
                                                        className="rounded border border-[#3B82F6]/40 px-2 py-1 text-xs text-[#6CA3EA] hover:bg-[#3B82F6]/10"
                                                    >
                                                        Tags
                                                    </button>
                                                    <button
                                                        onClick={() => editMenuItemImageUrl(item)}
                                                        className="rounded border border-[#00D98E]/40 px-2 py-1 text-xs text-[#4FE0A6] hover:bg-[#00D98E]/10"
                                                    >
                                                        URL
                                                    </button>
                                                    <button
                                                        onClick={() => rowImageInputRefs.current[item._id]?.click()}
                                                        disabled={updatingImageId === item._id}
                                                        className="rounded border border-[#CFAF63]/40 px-2 py-1 text-xs text-[#CFAF63] hover:bg-[#CFAF63]/10 disabled:opacity-50"
                                                    >
                                                        {updatingImageId === item._id ? "Uploading..." : "Upload"}
                                                    </button>
                                                    <input
                                                        ref={(element) => {
                                                            rowImageInputRefs.current[item._id] = element;
                                                        }}
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(event) => handleReplaceItemImage(item._id, event)}
                                                        className="hidden"
                                                    />
                                                    <button
                                                        onClick={() => deleteMenuItem(item._id)}
                                                        className="p-1 rounded hover:bg-[#FF6A00]/20 transition"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} className="text-[#FF6A00]" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* DELIVERY PARTNERS TAB */}
                {activeTab === "deliveryPartners" && (
                    <div className="space-y-6">
                        <motion.button
                            onClick={() => setShowDeliveryPartnerForm(!showDeliveryPartnerForm)}
                            whileHover={{ scale: 1.05 }}
                            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#CFAF63] to-[#FF6A00] px-6 py-3 font-semibold text-[#111]"
                        >
                            <Plus size={18} />
                            Add Delivery Partner
                        </motion.button>

                        {showDeliveryPartnerForm && (
                            <div className="glass-card rounded-2xl border border-[#CFAF63]/25 p-6">
                                <h3 className="mb-4 font-[var(--font-heading)] text-lg text-[#F5F5F5]">New Delivery Partner</h3>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        value={newDeliveryPartner.name}
                                        onChange={(e) => setNewDeliveryPartner((prev) => ({ ...prev, name: e.target.value }))}
                                        className="rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3"
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={newDeliveryPartner.email}
                                        onChange={(e) => setNewDeliveryPartner((prev) => ({ ...prev, email: e.target.value }))}
                                        className="rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Phone"
                                        value={newDeliveryPartner.phone}
                                        onChange={(e) => setNewDeliveryPartner((prev) => ({ ...prev, phone: e.target.value }))}
                                        className="rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3"
                                    />
                                    <input
                                        type="password"
                                        placeholder="Temporary Password"
                                        value={newDeliveryPartner.password}
                                        onChange={(e) => setNewDeliveryPartner((prev) => ({ ...prev, password: e.target.value }))}
                                        className="rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Vehicle Number"
                                        value={newDeliveryPartner.vehicleNumber}
                                        onChange={(e) => setNewDeliveryPartner((prev) => ({ ...prev, vehicleNumber: e.target.value }))}
                                        className="rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3"
                                    />
                                    <input
                                        type="text"
                                        placeholder="License Number"
                                        value={newDeliveryPartner.licenseNumber}
                                        onChange={(e) => setNewDeliveryPartner((prev) => ({ ...prev, licenseNumber: e.target.value }))}
                                        className="rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3"
                                    />
                                </div>
                                <div className="mt-4 flex gap-3">
                                    <button
                                        onClick={handleAddDeliveryPartner}
                                        disabled={deliveryPartnerSaving}
                                        className="rounded-lg bg-gradient-to-r from-[#CFAF63] to-[#FF6A00] px-6 py-2 text-sm font-semibold text-[#111]"
                                    >
                                        {deliveryPartnerSaving ? "Saving..." : "Save Partner"}
                                    </button>
                                    <button
                                        onClick={() => setShowDeliveryPartnerForm(false)}
                                        className="rounded-lg border border-[#CFAF63]/25 px-6 py-2 text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                                {deliveryPartnerError ? <p className="mt-3 text-sm text-rose-300">{deliveryPartnerError}</p> : null}
                            </div>
                        )}

                        <div className="glass-card rounded-2xl border border-[#CFAF63]/25 p-6 overflow-x-auto">
                            <h3 className="mb-4 font-[var(--font-heading)] text-lg text-[#F5F5F5]">Registered Delivery Partners</h3>
                            {deliveryPartnerError ? <p className="mb-3 text-sm text-rose-300">{deliveryPartnerError}</p> : null}
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[#333]">
                                        <th className="py-2 px-3 text-left text-[#999]">Name</th>
                                        <th className="py-2 px-3 text-left text-[#999]">Contact</th>
                                        <th className="py-2 px-3 text-left text-[#999]">Vehicle</th>
                                        <th className="py-2 px-3 text-left text-[#999]">License</th>
                                        <th className="py-2 px-3 text-left text-[#999]">Status</th>
                                        <th className="py-2 px-3 text-right text-[#999]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deliveryPartners.map((partner, index) => (
                                        <tr key={`${partner._id || partner.email}-${index}`} className="border-b border-[#1A1A1A]">
                                            <td className="py-3 px-3 text-[#F5F5F5]">{partner.name}</td>
                                            <td className="py-3 px-3 text-[#CCC]">
                                                <p>{partner.email}</p>
                                                <p className="text-xs text-[#999]">{partner.phone || "No phone"}</p>
                                            </td>
                                            <td className="py-3 px-3 text-[#CCC]">{partner.deliveryProfile?.vehicleNumber || "N/A"}</td>
                                            <td className="py-3 px-3 text-[#CCC]">{partner.deliveryProfile?.licenseNumber || "N/A"}</td>
                                            <td className="py-3 px-3">
                                                <span className={`rounded-full px-2 py-1 text-xs ${partner.deliveryProfile?.isActive === false ? "bg-rose-500/20 text-rose-300" : "bg-[#00D98E]/20 text-[#00D98E]"}`}>
                                                    {partner.deliveryProfile?.isActive === false ? "Inactive" : "Active"}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-right">
                                                <button
                                                    onClick={() => toggleDeliveryPartner(partner, !(partner.deliveryProfile?.isActive === false))}
                                                    className="rounded border border-[#CFAF63]/40 px-3 py-1 text-xs text-[#CFAF63] hover:bg-[#CFAF63]/10"
                                                >
                                                    {partner.deliveryProfile?.isActive === false ? "Activate" : "Deactivate"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === "staffUsers" && (
                    <div className="space-y-6">
                        <div className="glass-card rounded-2xl border border-[#CFAF63]/25 p-6">
                            <h3 className="font-[var(--font-heading)] text-xl text-[#F5F5F5] mb-2">Staff Access Management</h3>
                            <p className="text-sm text-[#999]">
                                Create and manage bearer, kitchen, manager, and general staff logins from one place.
                            </p>
                        </div>
                        <StaffUsersPanel />
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
                                {reservations.map((res, index) => (
                                    <tr key={`${res.id || `reservation-${res.phone}-${res.date}`}-${index}`} className="border-b border-[#1A1A1A] hover:bg-[#111]/50 transition">
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
                                    {screeningBookings.map((b, index) => (
                                        <tr key={`${b.id || `screening-${b.phone}-${b.date}`}-${index}`} className="border-b border-[#1A1A1A] hover:bg-[#111]/60 transition">
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
