"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { getAuthToken } from "@/lib/authToken";

type MenuItem = {
    _id: string;
    name: string;
    price: number;
    category: string;
    image?: string;
    isSoldOut?: boolean;
};

type CartEntry = {
    item: MenuItem;
    quantity: number;
};

type CreatedStaffOrder = {
    _id: string;
};

export function QuickOrderPanel() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [tableNumber, setTableNumber] = useState("");
    const [specialInstructions, setSpecialInstructions] = useState("");
    const [cart, setCart] = useState<CartEntry[]>([]);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState("");

    useEffect(() => {
        async function loadMenu() {
            try {
                const items = await apiFetch<MenuItem[]>('/api/menu');
                setMenuItems(items);
            } catch (requestError) {
                setError(requestError instanceof Error ? requestError.message : 'Failed to load menu items');
            } finally {
                setLoading(false);
            }
        }

        loadMenu();
    }, []);

    const filteredMenu = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return menuItems;
        return menuItems.filter((item) => item.name.toLowerCase().includes(query) || item.category.toLowerCase().includes(query));
    }, [menuItems, search]);

    const total = useMemo(() => cart.reduce((sum, entry) => sum + entry.item.price * entry.quantity, 0), [cart]);

    const addItem = (item: MenuItem) => {
        if (item.isSoldOut) return;
        setCart((prev) => {
            const existing = prev.find((entry) => entry.item._id === item._id);
            if (existing) {
                return prev.map((entry) => entry.item._id === item._id ? { ...entry, quantity: entry.quantity + 1 } : entry);
            }
            return [...prev, { item, quantity: 1 }];
        });
    };

    const updateQuantity = (itemId: string, quantity: number) => {
        if (quantity <= 0) {
            setCart((prev) => prev.filter((entry) => entry.item._id !== itemId));
            return;
        }

        setCart((prev) => prev.map((entry) => entry.item._id === itemId ? { ...entry, quantity } : entry));
    };

    const placeOrder = async () => {
        const token = getAuthToken();
        if (!token) {
            setError('Session expired. Please login again.');
            return;
        }

        if (!customerName.trim() || !tableNumber.trim() || cart.length === 0) {
            setError('Customer name, table number, and at least one item are required.');
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const created = await apiFetch<CreatedStaffOrder>("/api/orders/staff", {
                method: 'POST',
                token,
                body: JSON.stringify({
                    customerName,
                    customerPhone,
                    tableNumber: Number(tableNumber),
                    specialInstructions,
                    items: cart.map((entry) => ({ menuItemId: entry.item._id, quantity: entry.quantity })),
                    paymentMethod: 'Cash',
                    address: `Table ${tableNumber}`,
                }),
            });

            setSuccess(`Order ${created._id} created for Table ${tableNumber}.`);
            setCart([]);
            setCustomerName('');
            setCustomerPhone('');
            setTableNumber('');
            setSpecialInstructions('');
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Failed to create order');
        } finally {
            setSaving(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-[#CFAF63]/25 bg-[#111]/60 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#CFAF63]">Bearer Quick Order</p>
                    <h3 className="font-[var(--font-heading)] text-2xl text-[#F5F5F5]">Take Table Order</h3>
                </div>
                <p className="text-sm text-[#CFAF63]">Total: ₹{total}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" className="rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3 text-[#F5F5F5]" />
                <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Customer phone" className="rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3 text-[#F5F5F5]" />
                <input value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} placeholder="Table number" type="number" min={1} className="rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3 text-[#F5F5F5]" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search menu items" className="rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3 text-[#F5F5F5]" />
                <textarea value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} placeholder="Special instructions" className="min-h-24 rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3 text-[#F5F5F5] md:col-span-2" />
            </div>

            <div className="mt-5 rounded-2xl border border-[#333] p-4">
                <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm uppercase tracking-[0.15em] text-[#999]">Menu</h4>
                    {loading ? <span className="text-xs text-[#CFAF63]">Loading...</span> : null}
                </div>
                {error ? <p className="mb-3 text-sm text-rose-300">{error}</p> : null}
                <div className="grid max-h-72 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
                    {filteredMenu.map((item) => (
                        <button
                            key={item._id}
                            type="button"
                            onClick={() => addItem(item)}
                            disabled={Boolean(item.isSoldOut)}
                            className="rounded-xl border border-[#CFAF63]/20 bg-[#0F0F0F] p-3 text-left transition hover:border-[#CFAF63]/50 disabled:opacity-50"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-medium text-[#F5F5F5]">{item.name}</p>
                                    <p className="text-xs text-[#999]">{item.category}</p>
                                </div>
                                <p className="text-[#CFAF63]">₹{item.price}</p>
                            </div>
                            {item.isSoldOut ? <p className="mt-2 text-xs text-rose-300">Sold out</p> : null}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-5 rounded-2xl border border-[#333] p-4">
                <h4 className="mb-3 text-sm uppercase tracking-[0.15em] text-[#999]">Current Ticket</h4>
                {cart.length === 0 ? (
                    <p className="text-sm text-[#999]">No items added yet.</p>
                ) : (
                    <div className="space-y-3">
                        {cart.map((entry) => (
                            <div key={entry.item._id} className="flex items-center justify-between gap-3 rounded-xl bg-[#0F0F0F] px-3 py-2">
                                <div>
                                    <p className="text-sm text-[#F5F5F5]">{entry.item.name}</p>
                                    <p className="text-xs text-[#999]">₹{entry.item.price} each</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => updateQuantity(entry.item._id, entry.quantity - 1)} className="rounded-md border border-[#333] px-2 py-1 text-xs text-[#F5F5F5]">-</button>
                                    <span className="w-6 text-center text-sm text-[#F5F5F5]">{entry.quantity}</span>
                                    <button type="button" onClick={() => updateQuantity(entry.item._id, entry.quantity + 1)} className="rounded-md border border-[#333] px-2 py-1 text-xs text-[#F5F5F5]">+</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={placeOrder} disabled={saving} className="rounded-full bg-gradient-to-r from-[#CFAF63] to-[#FF6A00] px-6 py-3 font-semibold text-[#111] disabled:opacity-60">
                    {saving ? 'Creating Order...' : 'Create Table Order'}
                </button>
                <button type="button" onClick={() => setCart([])} className="rounded-full border border-[#CFAF63]/30 px-5 py-3 text-sm text-[#F5F5F5]">
                    Clear Ticket
                </button>
            </div>

            {success ? <p className="mt-3 text-sm text-[#00D98E]">{success}</p> : null}
        </motion.div>
    );
}
