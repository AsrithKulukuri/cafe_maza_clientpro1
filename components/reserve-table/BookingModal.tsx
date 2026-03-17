"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type BookingModalProps = {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
};

type BookingForm = {
    name: string;
    phone: string;
    guests: string;
    date: string;
    time: string;
    request: string;
};

const timeSlots = ["18:00", "19:00", "20:00", "21:00", "22:00", "23:00"];

const initialForm: BookingForm = {
    name: "",
    phone: "",
    guests: "2",
    date: "",
    time: "",
    request: "",
};

export function BookingModal({ open, onClose, onSuccess }: BookingModalProps) {
    const [form, setForm] = useState<BookingForm>(initialForm);
    const [submitted, setSubmitted] = useState(false);

    const isValid = useMemo(
        () => Boolean(form.name.trim() && form.phone.trim() && form.date && form.time),
        [form]
    );

    const update = (field: keyof BookingForm, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitted(true);
        if (!isValid) return;

        onSuccess();
        setForm(initialForm);
        setSubmitted(false);
        onClose();
    };

    return (
        <AnimatePresence>
            {open ? (
                <>
                    <motion.button
                        aria-label="Close booking modal"
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-140 bg-black/70 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 22 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.28, ease: "easeOut" }}
                        className="fixed left-1/2 top-1/2 z-150 w-[min(92vw,560px)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-[#CFAF63]/25 bg-[#121212]/95 p-6 shadow-[0_0_60px_rgba(255,106,0,0.2)] backdrop-blur-xl"
                    >
                        <h2 className="font-(--font-heading) text-3xl text-[#F5F5F5]">Book Table</h2>
                        <p className="mt-2 text-sm text-[#F5F5F5]/68">Reserve your premium table in seconds.</p>

                        <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
                            <label className="text-sm text-[#F5F5F5]/75">
                                Name
                                <input
                                    value={form.name}
                                    onChange={(event) => update("name", event.target.value)}
                                    className="mt-2 w-full rounded-xl border border-[#CFAF63]/25 bg-[#0E0E0E] px-4 py-3 outline-none transition focus:border-[#FF6A00]"
                                />
                                {submitted && !form.name.trim() ? <span className="mt-1 block text-xs text-[#FF6A00]">Name is required.</span> : null}
                            </label>

                            <label className="text-sm text-[#F5F5F5]/75">
                                Phone
                                <input
                                    value={form.phone}
                                    onChange={(event) => update("phone", event.target.value)}
                                    className="mt-2 w-full rounded-xl border border-[#CFAF63]/25 bg-[#0E0E0E] px-4 py-3 outline-none transition focus:border-[#FF6A00]"
                                />
                                {submitted && !form.phone.trim() ? <span className="mt-1 block text-xs text-[#FF6A00]">Phone is required.</span> : null}
                            </label>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="text-sm text-[#F5F5F5]/75">
                                    Number of people
                                    <select
                                        value={form.guests}
                                        onChange={(event) => update("guests", event.target.value)}
                                        className="mt-2 w-full rounded-xl border border-[#CFAF63]/25 bg-[#0E0E0E] px-4 py-3 outline-none transition focus:border-[#FF6A00]"
                                    >
                                        {[1, 2, 3, 4].map((count) => (
                                            <option key={count} value={count.toString()}>
                                                {count}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="text-sm text-[#F5F5F5]/75">
                                    Date
                                    <input
                                        type="date"
                                        value={form.date}
                                        onChange={(event) => update("date", event.target.value)}
                                        className="mt-2 w-full rounded-xl border border-[#CFAF63]/25 bg-[#0E0E0E] px-4 py-3 outline-none transition focus:border-[#FF6A00]"
                                    />
                                    {submitted && !form.date ? <span className="mt-1 block text-xs text-[#FF6A00]">Date is required.</span> : null}
                                </label>
                            </div>

                            <label className="text-sm text-[#F5F5F5]/75">
                                Time slot
                                <select
                                    value={form.time}
                                    onChange={(event) => update("time", event.target.value)}
                                    className="mt-2 w-full rounded-xl border border-[#CFAF63]/25 bg-[#0E0E0E] px-4 py-3 outline-none transition focus:border-[#FF6A00]"
                                >
                                    <option value="">Select a slot</option>
                                    {timeSlots.map((slot) => (
                                        <option key={slot} value={slot}>
                                            {slot}
                                        </option>
                                    ))}
                                </select>
                                {submitted && !form.time ? <span className="mt-1 block text-xs text-[#FF6A00]">Time slot is required.</span> : null}
                            </label>

                            <label className="text-sm text-[#F5F5F5]/75">
                                Special request
                                <textarea
                                    rows={3}
                                    value={form.request}
                                    onChange={(event) => update("request", event.target.value)}
                                    className="mt-2 w-full rounded-xl border border-[#CFAF63]/25 bg-[#0E0E0E] px-4 py-3 outline-none transition focus:border-[#FF6A00]"
                                />
                            </label>

                            <div className="mt-1 flex justify-end gap-3">
                                <button type="button" onClick={onClose} className="rounded-full border border-[#CFAF63]/35 px-5 py-2.5 text-sm text-[#F5F5F5]/88">
                                    Cancel
                                </button>
                                <button type="submit" className="luxury-button px-6 py-2.5 text-sm">
                                    Reserve Table
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </>
            ) : null}
        </AnimatePresence>
    );
}
