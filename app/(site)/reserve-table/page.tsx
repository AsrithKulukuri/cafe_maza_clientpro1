"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LuxuryButton } from "@/components/ui/LuxuryButton";

const tables = Array.from({ length: 12 }).map((_, idx) => ({
    id: idx + 1,
    seats: idx % 3 === 0 ? 6 : 4,
}));

export default function ReserveTablePage() {
    const [selectedTable, setSelectedTable] = useState<number | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [form, setForm] = useState({ name: "", phone: "", guests: "2", date: "", time: "", request: "" });

    const isValid = useMemo(
        () => Boolean(form.name && form.phone && form.date && form.time && selectedTable),
        [form, selectedTable]
    );

    return (
        <div className="mx-auto grid max-w-7xl gap-8 px-6 pb-20 md:grid-cols-2 md:px-10">
            <section className="glass-card rounded-3xl border border-[#CFAF63]/20 p-8">
                <p className="text-sm uppercase tracking-[0.2em] text-[#CFAF63]">Reserve Table</p>
                <h1 className="mt-2 font-[var(--font-heading)] text-4xl text-[#F5F5F5]">Plan Your<br />Luxury Dinner</h1>
                <div className="mt-2 h-[1px] w-16 bg-gradient-to-r from-[#CFAF63] to-transparent" />
                <p className="mt-4 text-sm text-[#F5F5F5]/70 mb-6">Secure your perfect table for an unforgettable culinary experience at Cafe Maza.</p>
                <form className="space-y-4">
                    {[
                        { key: "name", label: "Name", type: "text" },
                        { key: "phone", label: "Phone", type: "tel" },
                        { key: "guests", label: "Guests", type: "number" },
                        { key: "date", label: "Date", type: "date" },
                        { key: "time", label: "Time", type: "time" },
                    ].map((field) => (
                        <label key={field.key} className="block text-sm text-[#F5F5F5]/75">
                            {field.label}
                            <input
                                type={field.type}
                                value={form[field.key as keyof typeof form]}
                                onChange={(event) => setForm((prev) => ({ ...prev, [field.key]: event.target.value }))}
                                className="mt-2 w-full rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3 outline-none transition focus:border-[#FF6A00]"
                            />
                        </label>
                    ))}
                    <label className="block text-sm text-[#F5F5F5]/75">
                        Special Request
                        <textarea
                            rows={3}
                            value={form.request}
                            onChange={(event) => setForm((prev) => ({ ...prev, request: event.target.value }))}
                            placeholder="Birthday setup, high chair, window seat..."
                            className="mt-2 w-full rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3 outline-none transition focus:border-[#FF6A00]"
                        />
                    </label>
                    <LuxuryButton className="w-full py-3" onClick={() => isValid && setShowConfirmation(true)}>
                        Confirm Reservation
                    </LuxuryButton>
                </form>
            </section>

            <section className="glass-card rounded-3xl border border-[#CFAF63]/20 p-7">
                <h2 className="font-[var(--font-heading)] text-3xl text-[#F5F5F5]">Select Your Table</h2>
                <div className="mt-5 grid grid-cols-3 gap-4">
                    {tables.map((table) => (
                        <button
                            key={table.id}
                            onClick={() => setSelectedTable(table.id)}
                            className={`rounded-2xl border p-4 text-center transition ${selectedTable === table.id
                                ? "border-[#FF6A00] bg-[#FF6A00]/20 shadow-[0_0_18px_rgba(255,106,0,0.45)]"
                                : "border-[#CFAF63]/20 bg-[#161616] hover:-translate-y-1"
                                }`}
                        >
                            <p className="font-[var(--font-heading)] text-2xl">T{table.id}</p>
                            <p className="text-xs text-[#F5F5F5]/70">{table.seats} Seats</p>
                        </button>
                    ))}
                </div>
            </section>

            <AnimatePresence>
                {showConfirmation ? (
                    <motion.div
                        className="fixed inset-0 z-[90] grid place-items-center bg-black/70 p-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card w-full max-w-md rounded-2xl border border-[#CFAF63]/30 p-7 text-center"
                        >
                            <h3 className="font-[var(--font-heading)] text-3xl text-[#F5F5F5]">Reservation Confirmed</h3>
                            <p className="mt-3 text-sm text-[#F5F5F5]/75">Table T{selectedTable} is reserved for {form.name}. We look forward to serving you.</p>
                            <button
                                onClick={() => setShowConfirmation(false)}
                                className="mt-5 rounded-full border border-[#CFAF63]/35 px-5 py-2 text-sm"
                            >
                                Close
                            </button>
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
}
