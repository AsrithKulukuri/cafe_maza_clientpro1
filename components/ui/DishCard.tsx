"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";
import type { Dish } from "@/data/mockData";

type DishCardProps = {
    dish: Dish;
    onAdd?: (dish: Dish) => void;
};

export function DishCard({ dish, onAdd }: DishCardProps) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [addPulse, setAddPulse] = useState(false);
    const lower = dish.name.toLowerCase();
    const isVeg = !["chicken", "mutton", "lamb", "fish", "murgh"].some((token) => lower.includes(token));
    const popular = ["chicken tikka", "butter chicken", "biryani", "paneer butter masala"].some((token) => lower.includes(token));

    return (
        <motion.article
            whileHover={{ y: -12, scale: 1.02 }}
            transition={{ duration: 0.25, type: "tween" }}
            style={{ willChange: "transform" }}
            className="group overflow-hidden rounded-2xl border border-[#CFAF63]/30 bg-linear-to-br from-[#1A1816] to-[#0F0D0B] backdrop-blur-sm"
        >
            {/* Image Section - Bigger & Premium */}
            <div className="relative h-56 overflow-hidden bg-black/40">
                {!imageLoaded ? <div className="skeleton-shimmer absolute inset-0" /> : null}
                <Image
                    src={dish.image}
                    alt={dish.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    onLoad={() => setImageLoaded(true)}
                    className="object-cover transition duration-700 group-hover:scale-125"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-0 bg-linear-to-t from-[#FF6A00]/35 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />

                {/* Premium Badge */}
                <motion.div
                    className="absolute top-4 right-4 rounded-full border border-[#CFAF63]/50 bg-black/60 backdrop-blur px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#CFAF63]"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                >
                    {popular ? "🔥 Popular" : "⭐ Recommended"}
                </motion.div>
            </div>

            {/* Content Section - Enhanced */}
            <div className="space-y-4 p-5 group-hover:shadow-[0_0_60px_rgba(255,106,0,0.25)] transition-shadow duration-500">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                        <h3 className="font-(--font-heading) text-2xl text-[#F5F5F5] leading-tight">{dish.name}</h3>
                        <motion.span
                            className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition ${isVeg ? "bg-[#00D98E]/25 text-[#4FE0A6]" : "bg-[#FF6A00]/25 text-[#FF8533]"
                                }`}
                            whileHover={{ scale: 1.08 }}
                        >
                            <span className="inline-block h-2.5 w-2.5 rounded-full bg-current" />
                            {isVeg ? "🟢 Vegetarian" : "🔴 Non-Vegetarian"}
                        </motion.span>
                    </div>
                    <span className="whitespace-nowrap text-xl font-(--font-heading) text-[#CFAF63]">₹{dish.price}</span>
                </div>

                {dish.description ? (
                    <p className="text-sm text-[#F5F5F5]/65 leading-relaxed line-clamp-2">{dish.description}</p>
                ) : null}

                {onAdd ? (
                    <motion.button
                        onClick={() => {
                            onAdd(dish);
                            setAddPulse(true);
                            window.setTimeout(() => setAddPulse(false), 260);
                        }}
                        whileHover={{ scale: 1.02, boxShadow: "0_0_30px_rgba(255,106,0,0.4)" }}
                        whileTap={{ scale: 0.98 }}
                        animate={addPulse ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                        transition={{ duration: 0.28 }}
                        className="w-full rounded-lg border border-[#FF6A00]/50 bg-linear-to-r from-[#FF6A00]/20 to-[#CFAF63]/20 px-4 py-3 text-sm font-semibold text-[#F5F5F5] transition md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 hover:border-[#FF6A00] hover:from-[#FF6A00]/35 hover:to-[#CFAF63]/35"
                    >
                        + Add to Cart
                    </motion.button>
                ) : null}
            </div>
        </motion.article>
    );
}
