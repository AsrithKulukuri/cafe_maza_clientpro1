"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { Dish } from "@/data/mockData";

type CartItem = Dish & { qty: number };

export default function CheckoutPage() {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [placed, setPlaced] = useState(false);
    const [form, setForm] = useState({
        name: "",
        phone: "",
        address: "",
        instructions: "",
        payment: "UPI",
    });

    useEffect(() => {
        try {
            const raw = localStorage.getItem("cafeMazaCart");
            if (!raw) return;
            const parsed = JSON.parse(raw) as CartItem[];
            setCart(Array.isArray(parsed) ? parsed : []);
        } catch {
            setCart([]);
        }
    }, []);

    const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart]);

    const placeOrder = () => {
        if (!form.name || !form.phone || !form.address || !cart.length) return;
        setPlaced(true);
        localStorage.removeItem("cafeMazaCart");
    };

    if (placed) {
        return (
            <div className="mx-auto max-w-3xl px-6 pb-20 md:px-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card mt-10 rounded-3xl border border-[#CFAF63]/25 p-8 text-center"
                >
                    <p className="text-sm uppercase tracking-[0.2em] text-[#00D98E]">Order Confirmed</p>
                    <h1 className="mt-2 font-[var(--font-heading)] text-5xl text-[#F5F5F5]">Thank You</h1>
                    <p className="mt-4 text-[#F5F5F5]/75">
                        Your order has been placed successfully. You can track it live from the order tracking page.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        <Link href="/order-tracking" className="luxury-button px-6 py-3 text-sm">Track Order</Link>
                        <Link href="/menu" className="rounded-full border border-[#CFAF63]/30 px-6 py-3 text-sm text-[#F5F5F5]">Back to Menu</Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="mx-auto grid max-w-6xl gap-8 px-6 pb-20 md:grid-cols-[1.1fr_0.9fr] md:px-10">
            <section className="glass-card rounded-3xl border border-[#CFAF63]/20 p-7">
                <p className="text-sm uppercase tracking-[0.2em] text-[#CFAF63]">Checkout</p>
                <h1 className="mt-2 font-[var(--font-heading)] text-4xl text-[#F5F5F5]">Complete Your Order</h1>

                <div className="mt-6 space-y-4">
                    <label className="block text-sm text-[#F5F5F5]/75">
                        Name
                        <input
                            value={form.name}
                            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                            className="mt-2 w-full rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3"
                        />
                    </label>
                    <label className="block text-sm text-[#F5F5F5]/75">
                        Phone
                        <input
                            value={form.phone}
                            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                            className="mt-2 w-full rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3"
                        />
                    </label>
                    <label className="block text-sm text-[#F5F5F5]/75">
                        Address
                        <textarea
                            rows={3}
                            value={form.address}
                            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                            className="mt-2 w-full rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3"
                        />
                    </label>
                    <label className="block text-sm text-[#F5F5F5]/75">
                        Delivery Instructions
                        <textarea
                            rows={2}
                            value={form.instructions}
                            onChange={(e) => setForm((prev) => ({ ...prev, instructions: e.target.value }))}
                            className="mt-2 w-full rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3"
                            placeholder="Gate number, landmark, call on arrival..."
                        />
                    </label>
                    <label className="block text-sm text-[#F5F5F5]/75">
                        Payment Option
                        <select
                            value={form.payment}
                            onChange={(e) => setForm((prev) => ({ ...prev, payment: e.target.value }))}
                            className="mt-2 w-full rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3"
                        >
                            <option>UPI</option>
                            <option>Card</option>
                            <option>Cash on delivery</option>
                        </select>
                    </label>
                </div>
            </section>

            <aside className="glass-card h-fit rounded-3xl border border-[#CFAF63]/20 p-7">
                <h2 className="font-[var(--font-heading)] text-3xl text-[#F5F5F5]">Order Summary</h2>
                <ul className="mt-4 space-y-2 text-sm">
                    {cart.length ? (
                        cart.map((item) => (
                            <li key={item.name} className="flex items-center justify-between rounded-lg bg-[#151515] px-3 py-2 text-[#F5F5F5]/85">
                                <span>{item.name} x {item.qty}</span>
                                <span>₹{item.price * item.qty}</span>
                            </li>
                        ))
                    ) : (
                        <li className="text-[#F5F5F5]/60">No items in cart.</li>
                    )}
                </ul>
                <div className="mt-5 flex items-center justify-between border-t border-[#CFAF63]/15 pt-3">
                    <span className="text-[#F5F5F5]/75">Total</span>
                    <span className="text-2xl text-[#CFAF63]">₹{total}</span>
                </div>
                <button
                    onClick={placeOrder}
                    disabled={!cart.length}
                    className="mt-5 w-full rounded-full bg-gradient-to-r from-[#CFAF63] via-[#FFD78B] to-[#FF6A00] px-4 py-3 font-semibold text-[#111] disabled:opacity-50"
                >
                    Place Order
                </button>
            </aside>
        </div>
    );
}
