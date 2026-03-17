"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function StaffLoginPage() {
    const [staffId, setStaffId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (staffId.trim() && password.trim()) {
            localStorage.setItem("staffLoggedIn", JSON.stringify({ staffId, name: "Chef Vikram", role: "chef" }));
            router.push("/staff/dashboard");
        } else {
            setError("Please fill in all fields");
        }
    };

    return (
        <div className="grid min-h-screen place-items-center bg-[#0B0B0B] p-6">
            <motion.form
                onSubmit={handleSubmit}
                onFocus={() => setError("")}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card w-full max-w-md rounded-3xl border border-[#CFAF63]/25 p-8"
            >
                <p className="text-sm uppercase tracking-[0.2em] text-[#CFAF63]">Staff Portal</p>
                <h1 className="mt-2 font-[var(--font-heading)] text-4xl text-[#F5F5F5]">Staff Login</h1>

                {error && <p className="mt-4 text-center text-sm text-[#FF6A00]">{error}</p>}

                <div className="mt-6 space-y-4">
                    <input
                        type="text"
                        placeholder="Staff ID (e.g., CHEF001)"
                        value={staffId}
                        onChange={(e) => setStaffId(e.target.value)}
                        className="w-full rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3 text-[#F5F5F5] placeholder-[#666] focus:border-[#CFAF63] focus:outline-none transition"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3 text-[#F5F5F5] placeholder-[#666] focus:border-[#CFAF63] focus:outline-none transition"
                    />
                    <button type="submit" className="luxury-button w-full rounded-full bg-gradient-to-r from-[#CFAF63] via-[#FFD78B] to-[#FF6A00] px-4 py-3 font-semibold text-[#111] hover:shadow-lg transition">
                        Access Dashboard
                    </button>
                </div>

                <p className="mt-6 text-center text-xs text-[#999]">
                    Demo: Use any Staff ID (e.g., CHEF001) with any password
                </p>
            </motion.form>
        </div>
    );
}
