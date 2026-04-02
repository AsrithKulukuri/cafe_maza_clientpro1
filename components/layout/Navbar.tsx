"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { User } from "@supabase/supabase-js";
import { navLinks } from "@/data/mockData";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Menu, ShoppingBag, X } from "lucide-react";
import { usePremiumUI } from "@/components/providers/PremiumUIProvider";
import { clearAuthSession, getAuthUser, type AppUser } from "@/lib/authToken";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [user, setUser] = useState<AppUser | null>(null);
    const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
    const pathname = usePathname();
    const { cartCount, openCart, openBooking } = usePremiumUI();
    const supabase = useMemo(() => createSupabaseBrowserClient(), []);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        const syncUser = () => {
            setUser(getAuthUser());
        };

        syncUser();

        window.addEventListener("storage", syncUser);
        return () => window.removeEventListener("storage", syncUser);
    }, []);

    useEffect(() => {
        setUser(getAuthUser());
    }, [pathname]);

    useEffect(() => {
        let mounted = true;

        supabase.auth.getUser().then(({ data }) => {
            if (mounted) {
                setSupabaseUser(data.user ?? null);
            }
        });

        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
            setSupabaseUser(session?.user ?? null);
        });

        return () => {
            mounted = false;
            data.subscription.unsubscribe();
        };
    }, [supabase]);

    const handleLogout = async () => {
        clearAuthSession();
        setUser(null);

        if (supabaseUser) {
            await supabase.auth.signOut();
            setSupabaseUser(null);
        }
    };

    const formatRole = (role: string) => role.charAt(0).toUpperCase() + role.slice(1);
    const supabaseName =
        (supabaseUser?.user_metadata?.full_name as string | undefined) ||
        (supabaseUser?.user_metadata?.name as string | undefined) ||
        supabaseUser?.email?.split("@")[0] ||
        null;
    const displayName = user?.name || supabaseName;
    const displayRole = user?.role || (supabaseUser ? "customer" : null);

    return (
        <header
            className={`fixed top-0 z-50 w-full border-b border-[#CFAF63]/20 transition-all duration-300 ${scrolled ? "bg-[#0B0B0B]/95 backdrop-blur-xl" : "bg-transparent"
                }`}
        >
            <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
                <Link href="/" className="flex items-center gap-3">
                    <BrandLogo />
                    <span className="font-(--font-heading) text-lg tracking-[0.22em] text-[#F5F5F5]">CAFE MAZA</span>
                </Link>

                <ul className="hidden items-center gap-5 lg:flex">
                    {navLinks.map((item) => (
                        <li key={item.href}>
                            <Link href={item.href} className="group relative text-sm tracking-wide text-[#F5F5F5]/88">
                                {item.label}
                                <span className="absolute -bottom-1 left-0 h-px w-0 bg-linear-to-r from-[#CFAF63] to-[#FF6A00] transition-all duration-300 group-hover:w-full" />
                            </Link>
                        </li>
                    ))}
                </ul>

                <div className="flex items-center gap-2">
                    <button
                        onClick={openBooking}
                        className="hidden rounded-full border border-[#CFAF63]/40 px-4 py-2 text-xs text-[#F5F5F5] transition hover:border-[#FF6A00] sm:block"
                    >
                        Book Table
                    </button>
                    <button
                        onClick={openCart}
                        className="relative rounded-full border border-[#CFAF63]/30 p-2 text-[#F5F5F5] transition hover:border-[#FF6A00]"
                        aria-label="Open cart"
                    >
                        <ShoppingBag size={16} />
                        {cartCount > 0 ? (
                            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#FF6A00] px-1 text-[10px] font-semibold text-white">
                                {cartCount}
                            </span>
                        ) : null}
                    </button>
                    {displayName && displayRole ? (
                        <>
                            <div className="hidden sm:block rounded-full border border-[#00D98E]/35 px-4 py-2 text-xs text-[#00D98E]">
                                Hi, {displayName} ({formatRole(displayRole)})
                            </div>
                            <motion.div
                                whileHover={{ y: -2 }}
                                className="hidden sm:block"
                            >
                                <Link href="/my-orders" className="rounded-full border border-[#CFAF63]/40 px-4 py-2 text-xs text-[#CFAF63] hover:border-[#FF6A00] transition">
                                    My Orders
                                </Link>
                            </motion.div>
                            <motion.button
                                whileHover={{ y: -2 }}
                                onClick={() => void handleLogout()}
                                className="hidden sm:block rounded-full border border-[#FF6A00]/40 px-4 py-2 text-xs text-[#FF6A00]"
                            >
                                Logout
                            </motion.button>
                        </>
                    ) : (
                        <motion.div whileHover={{ y: -2 }} className="hidden sm:block">
                            <Link href="/login" className="rounded-full border border-[#CFAF63]/40 px-4 py-2 text-xs text-[#F5F5F5]">
                                Login
                            </Link>
                        </motion.div>
                    )}
                    <motion.div whileHover={{ y: -2 }} className="hidden xl:block">
                        <Link href="/staff-login" className="rounded-full border border-[#CFAF63]/40 px-4 py-2 text-xs text-[#F5F5F5]">
                            Staff
                        </Link>
                    </motion.div>
                    <motion.div whileHover={{ y: -2 }} className="hidden xl:block">
                        <Link href="/delivery-login" className="rounded-full border border-[#3B82F6]/40 px-4 py-2 text-xs text-[#6CA3EA]">
                            Delivery
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
                                <button onClick={() => { setMobileMenuOpen(false); openBooking(); }} className="block text-sm text-[#F5F5F5]/88">
                                    Book Table
                                </button>
                            </li>
                            <li className="py-3 border-b border-[#CFAF63]/10">
                                <button onClick={() => { setMobileMenuOpen(false); openCart(); }} className="block text-sm text-[#F5F5F5]/88">
                                    Cart ({cartCount})
                                </button>
                            </li>
                            {displayName && displayRole ? (
                                <>
                                    <li className="py-3 border-b border-[#CFAF63]/10 text-sm text-[#00D98E]">Hi, {displayName} ({formatRole(displayRole)})</li>
                                    <li className="py-3 border-b border-[#CFAF63]/10">
                                        <Link href="/my-orders" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-[#CFAF63]">
                                            My Orders
                                        </Link>
                                    </li>
                                    <li className="py-3 border-b border-[#CFAF63]/10">
                                        <button
                                            onClick={() => {
                                                void handleLogout();
                                                setMobileMenuOpen(false);
                                            }}
                                            className="block text-sm text-[#FF6A00]"
                                        >
                                            Logout
                                        </button>
                                    </li>
                                </>
                            ) : (
                                <li className="py-3 border-b border-[#CFAF63]/10">
                                    <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-[#F5F5F5]/88">
                                        Login
                                    </Link>
                                </li>
                            )}
                            <li className="py-3">
                                <Link href="/staff-login" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-[#F5F5F5]/88">
                                    Staff
                                </Link>
                            </li>
                            <li className="py-3">
                                <Link href="/delivery-login" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-[#6CA3EA]">
                                    Delivery
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
