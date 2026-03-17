"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { navLinks } from "@/data/mockData";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Menu, X } from "lucide-react";

export function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <header
            className={`fixed top-0 z-50 w-full border-b border-[#CFAF63]/20 transition-all duration-300 ${scrolled ? "bg-[#0B0B0B]/95 backdrop-blur-xl" : "bg-transparent"
                }`}
        >
            <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
                <Link href="/" className="flex items-center gap-3">
                    <BrandLogo />
                    <span className="font-[var(--font-heading)] text-lg tracking-[0.22em] text-[#F5F5F5]">CAFE MAZA</span>
                </Link>

                <ul className="hidden items-center gap-5 lg:flex">
                    {navLinks.map((item) => (
                        <li key={item.href}>
                            <Link href={item.href} className="group relative text-sm tracking-wide text-[#F5F5F5]/88">
                                {item.label}
                                <span className="absolute -bottom-1 left-0 h-px w-0 bg-gradient-to-r from-[#CFAF63] to-[#FF6A00] transition-all duration-300 group-hover:w-full" />
                            </Link>
                        </li>
                    ))}
                </ul>

                <div className="flex items-center gap-2">
                    <motion.div whileHover={{ y: -2 }} className="hidden sm:block">
                        <Link href="/login" className="rounded-full border border-[#CFAF63]/40 px-4 py-2 text-xs text-[#F5F5F5]">
                            Login
                        </Link>
                    </motion.div>
                    <motion.div whileHover={{ y: -2 }} className="hidden xl:block">
                        <Link href="/staff-login" className="rounded-full border border-[#CFAF63]/40 px-4 py-2 text-xs text-[#F5F5F5]">
                            Staff
                        </Link>
                    </motion.div>
                    <motion.div whileHover={{ y: -2 }} className="hidden xl:block">
                        <Link href="/admin-login" className="rounded-full border border-[#FF6A00]/40 px-4 py-2 text-xs text-[#FF6A00]">
                            Admin
                        </Link>
                    </motion.div>
                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2">
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </nav>

            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden border-t border-[#CFAF63]/20 bg-[#0B0B0B]/95 backdrop-blur-xl"
                    >
                        <ul className="flex flex-col gap-0 px-4 py-3">
                            {navLinks.map((item) => (
                                <li key={item.href}>
                                    <Link href={item.href} onClick={() => setMobileMenuOpen(false)} className="block py-3 text-sm text-[#F5F5F5]/88 border-b border-[#CFAF63]/10">
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                            <li className="py-3 border-b border-[#CFAF63]/10">
                                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-[#F5F5F5]/88">
                                    Login
                                </Link>
                            </li>
                            <li className="py-3">
                                <Link href="/staff-login" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-[#F5F5F5]/88">
                                    Staff
                                </Link>
                            </li>
                            <li className="py-3">
                                <Link href="/admin-login" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-[#FF6A00]">
                                    Admin
                                </Link>
                            </li>
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
