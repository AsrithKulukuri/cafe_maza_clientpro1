"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { Dish } from "@/data/mockData";
import { apiFetch } from "@/lib/api";
import { getAuthToken } from "@/lib/authToken";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const CheckoutLocationPicker = dynamic(
    () => import("@/components/map/CheckoutLocationPicker").then((mod) => mod.CheckoutLocationPicker),
    { ssr: false },
);

type CartItem = Dish & { qty: number };

type BackendMenuItem = {
    _id: string;
    name: string;
};

type CreatedOrder = {
    _id: string;
    paymentStatus: "success" | "paid" | "pending";
};

type RazorpayOrderResponse = {
    keyId: string;
    razorpayOrderId: string;
    amount: number;
    currency: string;
    totalAmount: number;
};

type PaymentSuccessResponse = {
    orderId: string;
    paymentStatus: "success" | "paid" | "pending";
};

type RazorpayPaymentResult = {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
};

type RazorpayInstance = {
    open: () => void;
    on: (event: "payment.failed", callback: (response: { error?: { description?: string } }) => void) => void;
};

type RazorpayConstructor = new (options: {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    prefill: {
        name?: string;
        email?: string;
        contact?: string;
    };
    notes: {
        source: string;
    };
    theme: {
        color: string;
    };
    modal: {
        ondismiss: () => void;
    };
    handler: (response: RazorpayPaymentResult) => void;
}) => RazorpayInstance;

async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
    const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
        {
            headers: {
                Accept: "application/json",
            },
        },
    );

    if (!response.ok) {
        throw new Error("Unable to fetch address from current location");
    }

    const body = (await response.json()) as { display_name?: string };
    return body.display_name?.trim() || "";
}

function getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported in this browser"));
            return;
        }

        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
        });
    });
}

function loadRazorpayCheckoutScript(): Promise<boolean> {
    if (typeof window === "undefined") {
        return Promise.resolve(false);
    }

    const existingRazorpay = (window as Window & { Razorpay?: RazorpayConstructor }).Razorpay;
    if (existingRazorpay) {
        return Promise.resolve(true);
    }

    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

function openRazorpayCheckout({
    keyId,
    amount,
    currency,
    razorpayOrderId,
    customerName,
    customerEmail,
    customerPhone,
}: {
    keyId: string;
    amount: number;
    currency: string;
    razorpayOrderId: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
}): Promise<RazorpayPaymentResult> {
    return new Promise((resolve, reject) => {
        const Razorpay = (window as Window & { Razorpay?: RazorpayConstructor }).Razorpay;

        if (!Razorpay) {
            reject(new Error("Unable to load Razorpay checkout"));
            return;
        }

        const instance = new Razorpay({
            key: keyId,
            amount,
            currency,
            name: "Cafe Maza",
            description: "Food Order Payment",
            order_id: razorpayOrderId,
            prefill: {
                name: customerName,
                email: customerEmail,
                contact: customerPhone,
            },
            notes: {
                source: "cafe_maza_web_checkout",
            },
            theme: {
                color: "#CFAF63",
            },
            modal: {
                ondismiss: () => {
                    reject(new Error("Payment was cancelled"));
                },
            },
            handler: (response) => {
                resolve(response);
            },
        });

        instance.on("payment.failed", (response) => {
            reject(new Error(response.error?.description || "Payment failed"));
        });

        instance.open();
    });
}

export default function CheckoutPage() {
    const router = useRouter();
    const hasTriedAutoAddressRef = useRef(false);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [placed, setPlaced] = useState(false);
    const [placing, setPlacing] = useState(false);
    const [error, setError] = useState("");
    const [locationMessage, setLocationMessage] = useState("");
    const [locatingAddress, setLocatingAddress] = useState(false);
    const [selectedPoint, setSelectedPoint] = useState<{ latitude: number; longitude: number } | null>(null);
    const [orderId, setOrderId] = useState("");
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

    const fillCurrentAddress = useCallback(async (userInitiated: boolean) => {
        setLocationMessage("");
        setLocatingAddress(true);

        try {
            const position = await getCurrentPosition();
            const { latitude, longitude } = position.coords;

            let address = "";
            try {
                address = await reverseGeocode(latitude, longitude);
            } catch {
                address = "";
            }

            const resolvedAddress = address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

            setForm((prev) => ({ ...prev, address: resolvedAddress }));
            setSelectedPoint({ latitude, longitude });
            setLocationMessage(
                userInitiated
                    ? "Current address captured. You can edit it before placing the order."
                    : "Current address auto-filled. You can edit it before placing the order.",
            );
        } catch (geoError) {
            if (userInitiated) {
                const message = geoError instanceof Error ? geoError.message : "Could not read your current location";
                setLocationMessage(message);
            }
        } finally {
            setLocatingAddress(false);
        }
    }, []);

    useEffect(() => {
        if (hasTriedAutoAddressRef.current) {
            return;
        }

        if (form.address.trim()) {
            return;
        }

        hasTriedAutoAddressRef.current = true;
        void fillCurrentAddress(false);
    }, [fillCurrentAddress, form.address]);

    const useCurrentAddress = async () => {
        await fillCurrentAddress(true);
    };

    const updateAddressFromPoint = useCallback(async (latitude: number, longitude: number) => {
        setLocatingAddress(true);

        try {
            const address = await reverseGeocode(latitude, longitude);
            const resolvedAddress = address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            setForm((prev) => ({ ...prev, address: resolvedAddress }));
            setLocationMessage("Map location updated. Address refreshed.");
        } catch {
            setForm((prev) => ({ ...prev, address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` }));
            setLocationMessage("Map location updated with coordinates.");
        } finally {
            setLocatingAddress(false);
        }
    }, []);

    const onMapPointChange = useCallback(
        (point: { latitude: number; longitude: number }) => {
            setSelectedPoint(point);
            void updateAddressFromPoint(point.latitude, point.longitude);
        },
        [updateAddressFromPoint],
    );

    const placeOrder = async () => {
        if (!form.name || !form.phone || !form.address || !cart.length) {
            setError("Please fill name, phone, address, and add at least one item.");
            return;
        }

        setError("");
        setPlacing(true);

        try {
            const token = getAuthToken();
            const supabase = createSupabaseBrowserClient();
            const {
                data: { user: supabaseUser },
            } = await supabase.auth.getUser();

            if (!token && !supabaseUser) {
                router.push("/login?next=/checkout");
                return;
            }

            const menu = await apiFetch<BackendMenuItem[]>("/api/menu");
            const menuIdByName = new Map(menu.map((item) => [item.name.toLowerCase(), item._id]));

            const items = cart.map((item) => {
                const menuItemId = menuIdByName.get(item.name.toLowerCase());

                if (!menuItemId) {
                    throw new Error(`Menu item not found in backend: ${item.name}`);
                }

                return { menuItemId, quantity: item.qty };
            });

            const payload = {
                items,
                address: `${form.address}${selectedPoint ? ` | coords:${selectedPoint.latitude.toFixed(6)},${selectedPoint.longitude.toFixed(6)}` : ""}${form.instructions ? ` | ${form.instructions}` : ""}`,
                customerPhone: form.phone,
                paymentMethod: form.payment,
            };

            const customerName = form.name || supabaseUser?.user_metadata?.name || "Customer";
            const customerEmail = supabaseUser?.email || undefined;

            let createdOrderId = "";

            if (form.payment === "Cash") {
                const created = token
                    ? await apiFetch<CreatedOrder>("/api/orders", {
                        method: "POST",
                        token,
                        body: JSON.stringify(payload),
                    })
                    : await apiFetch<CreatedOrder>("/api/orders/public", {
                        method: "POST",
                        body: JSON.stringify({
                            ...payload,
                            customerName,
                            customerEmail: customerEmail || null,
                        }),
                    });

                createdOrderId = created._id;
            } else {
                const loaded = await loadRazorpayCheckoutScript();
                if (!loaded) {
                    throw new Error("Unable to load payment gateway. Please try again.");
                }

                const razorpayOrder = token
                    ? await apiFetch<RazorpayOrderResponse>("/api/orders/create-razorpay-order", {
                        method: "POST",
                        token,
                        body: JSON.stringify(payload),
                    })
                    : await apiFetch<RazorpayOrderResponse>("/api/orders/create-razorpay-order/public", {
                        method: "POST",
                        body: JSON.stringify({
                            ...payload,
                            customerName,
                            customerEmail: customerEmail || null,
                        }),
                    });

                const paymentResult = await openRazorpayCheckout({
                    keyId: razorpayOrder.keyId,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    razorpayOrderId: razorpayOrder.razorpayOrderId,
                    customerName,
                    customerEmail,
                    customerPhone: form.phone,
                });

                const verificationPayload = {
                    ...payload,
                    razorpayOrderId: paymentResult.razorpay_order_id,
                    razorpayPaymentId: paymentResult.razorpay_payment_id,
                    razorpaySignature: paymentResult.razorpay_signature,
                };

                const verified = token
                    ? await apiFetch<PaymentSuccessResponse>("/api/orders/payment-success-callback", {
                        method: "POST",
                        token,
                        body: JSON.stringify(verificationPayload),
                    })
                    : await apiFetch<PaymentSuccessResponse>("/api/orders/payment-success-callback/public", {
                        method: "POST",
                        body: JSON.stringify({
                            ...verificationPayload,
                            customerName,
                            customerEmail: customerEmail || null,
                        }),
                    });

                createdOrderId = verified.orderId;
            }

            setOrderId(createdOrderId);
            setPlaced(true);
            localStorage.removeItem("cafeMazaCart");
            router.push(`/my-orders?orderId=${createdOrderId}`);
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Failed to place order");
        } finally {
            setPlacing(false);
        }
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
                    {orderId ? <p className="mt-2 text-sm text-[#CFAF63]">Order ID: {orderId}</p> : null}
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        <Link href={orderId ? `/order-tracking?orderId=${orderId}` : "/order-tracking"} className="luxury-button px-6 py-3 text-sm">Track Order</Link>
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
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={useCurrentAddress}
                                disabled={locatingAddress}
                                className="rounded-full border border-[#CFAF63]/35 px-3 py-1 text-xs text-[#CFAF63] hover:border-[#FF6A00] hover:text-[#FF6A00] disabled:opacity-60"
                            >
                                {locatingAddress ? "Detecting..." : "Use Current Address"}
                            </button>
                            {locationMessage ? <span className="text-xs text-[#F5F5F5]/70">{locationMessage}</span> : null}
                        </div>
                        <textarea
                            rows={3}
                            value={form.address}
                            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                            className="mt-2 w-full rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3"
                        />
                    </label>
                    {selectedPoint ? (
                        <div className="space-y-2">
                            <p className="text-sm text-[#F5F5F5]/75">Map View (move pin to edit location)</p>
                            <CheckoutLocationPicker value={selectedPoint} onChange={onMapPointChange} />
                            <p className="text-xs text-[#F5F5F5]/65">
                                Lat: {selectedPoint.latitude.toFixed(6)}, Lng: {selectedPoint.longitude.toFixed(6)}
                            </p>
                        </div>
                    ) : null}
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
                            <option value="UPI">UPI</option>
                            <option value="Card">Card</option>
                            <option value="Cash">Cash on delivery</option>
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
                    disabled={!cart.length || placing}
                    className="mt-5 w-full rounded-full bg-gradient-to-r from-[#CFAF63] via-[#FFD78B] to-[#FF6A00] px-4 py-3 font-semibold text-[#111] disabled:opacity-50"
                >
                    {placing ? "Processing..." : form.payment === "Cash" ? "Place Order" : "Pay & Place Order"}
                </button>
                {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
            </aside>
        </div>
    );
}
