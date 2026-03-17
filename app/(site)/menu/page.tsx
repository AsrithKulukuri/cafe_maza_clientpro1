"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DishCard } from "@/components/ui/DishCard";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { menuCategories, type Dish } from "@/data/mockData";

export default function MenuPage() {
    const [active, setActive] = useState(menuCategories[0].id);
    const [cart, setCart] = useState<Array<Dish & { qty: number }>>([]);
    const current = useMemo(() => menuCategories.find((category) => category.id === active) ?? menuCategories[0], [active]);

    const addToCart = (dish: Dish) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.name === dish.name);
            const next = existing
                ? prev.map((item) => (item.name === dish.name ? { ...item, qty: item.qty + 1 } : item))
                : [...prev, { ...dish, qty: 1 }];

            localStorage.setItem("cafeMazaCart", JSON.stringify(next));
            return next;
        });
    };

    const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
    const cartTotal = cart.reduce((sum, item) => sum + item.qty * item.price, 0);

    return (
        <div className="mx-auto max-w-7xl px-6 pb-20 md:px-10">
            <header className="mb-6">
                <p className="text-sm uppercase tracking-[0.2em] text-[#CFAF63]">Interactive Menu</p>
                <h1 className="mt-2 font-[var(--font-heading)] text-6xl text-[#F5F5F5] leading-tight">Chef Curated<br />Selections</h1>
                <GoldDivider className="max-w-md" />
                <p className="mt-4 text-[#F5F5F5]/70 max-w-lg leading-relaxed">
                    Discover our carefully curated menu featuring authentic Indian flavors, premium grilled specialties,
                    and signature biryanis. Each dish is crafted with passion and perfected over years of culinary excellence.
                </p>
            </header>

            <div className="mb-10 flex flex-wrap gap-3">
                {menuCategories.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => setActive(category.id)}
                        className={`rounded-full border px-5 py-2 text-sm transition ${active === category.id
                            ? "border-[#FF6A00] bg-[#FF6A00]/20 text-[#F5F5F5] shadow-[0_0_20px_rgba(255,106,0,0.2)]"
                            : "border-[#CFAF63]/30 bg-[#141414] text-[#F5F5F5]/80 hover:border-[#CFAF63]"
                            }`}
                    >
                        {category.label}
                    </button>
                ))}
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {current.items.map((dish) => (
                    <DishCard key={dish.name} dish={dish} onAdd={addToCart} />
                ))}
            </div>

            {cartCount > 0 ? (
                <div className="fixed bottom-5 left-1/2 z-40 w-[min(94%,680px)] -translate-x-1/2 rounded-2xl border border-[#CFAF63]/35 bg-[#101010]/95 px-4 py-3 backdrop-blur-xl">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.12em] text-[#999]">Cart Ready</p>
                            <p className="text-sm text-[#F5F5F5]">{cartCount} items • ₹{cartTotal}</p>
                        </div>
                        <Link href="/checkout" className="luxury-button px-5 py-2 text-xs md:text-sm">
                            Proceed to Checkout
                        </Link>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
