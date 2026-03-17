import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function Footer() {
    return (
        <footer className="border-t border-[#CFAF63]/20 bg-[#0B0B0B] px-6 py-12 md:px-10">
            <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4">
                <div>
                    <div className="flex items-center gap-3">
                        <BrandLogo className="h-14 w-14" />
                        <div>
                            <h4 className="font-[var(--font-heading)] text-xl text-[#CFAF63]">Cafe Maza</h4>
                            <p className="text-[10px] uppercase tracking-[0.28em] text-[#F5F5F5]/45">Live Grill Luxury</p>
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-[#F5F5F5]/70">Luxury family dining, live grills, and legendary biryani.</p>
                </div>
                <div>
                    <h5 className="text-sm uppercase tracking-[0.2em] text-[#CFAF63]">Menu</h5>
                    <ul className="mt-3 space-y-2 text-sm text-[#F5F5F5]/80">
                        <li><Link href="/menu">Soups & Starters</Link></li>
                        <li><Link href="/menu">Main Course</Link></li>
                        <li><Link href="/menu">Biryani</Link></li>
                    </ul>
                </div>
                <div>
                    <h5 className="text-sm uppercase tracking-[0.2em] text-[#CFAF63]">Reservations</h5>
                    <ul className="mt-3 space-y-2 text-sm text-[#F5F5F5]/80">
                        <li><Link href="/reserve-table">Reserve Table</Link></li>
                        <li><Link href="/screening">Private Screening</Link></li>
                        <li><Link href="/order-online">Order Online</Link></li>
                    </ul>
                </div>
                <div>
                    <h5 className="text-sm uppercase tracking-[0.2em] text-[#CFAF63]">Contact</h5>
                    <p className="mt-3 text-sm text-[#F5F5F5]/80">Banjara Hills, Hyderabad</p>
                    <p className="text-sm text-[#F5F5F5]/80">+91 90000 12345</p>
                    <div className="mt-4 flex gap-3 text-xs text-[#F5F5F5]/70">
                        <span className="glass-card rounded-full px-3 py-1">Instagram</span>
                        <span className="glass-card rounded-full px-3 py-1">Facebook</span>
                        <span className="glass-card rounded-full px-3 py-1">YouTube</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
