"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type ProfileApiResponse = {
    profile: {
        full_name: string | null;
        phone_e164: string | null;
        pending_phone_e164: string | null;
        phone_verified: boolean;
    } | null;
    user: {
        email: string | null;
        fullName: string | null;
    };
};

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = useMemo(() => createSupabaseBrowserClient(), []);

    const [user, setUser] = useState<User | null>(null);
    const [loadingSession, setLoadingSession] = useState(true);
    const [busy, setBusy] = useState(false);
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [verified, setVerified] = useState(false);
    const [resendIn, setResendIn] = useState(0);
    const [info, setInfo] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const oauthStatus = searchParams.get("oauth");

        if (oauthStatus === "success") {
            setInfo("Google sign-in successful. Verify your mobile number with OTP to continue.");
        }

        if (oauthStatus === "error") {
            setError("Google sign-in failed. Please try again.");
        }
    }, [searchParams]);

    useEffect(() => {
        async function bootstrap() {
            const {
                data: { user: currentUser },
            } = await supabase.auth.getUser();

            setUser(currentUser ?? null);

            if (!currentUser) {
                setLoadingSession(false);
                return;
            }

            await loadProfile();
            setLoadingSession(false);
        }

        bootstrap();
    }, [supabase]);

    useEffect(() => {
        if (resendIn <= 0) {
            return;
        }

        const timer = setInterval(() => {
            setResendIn((previous) => Math.max(0, previous - 1));
        }, 1000);

        return () => clearInterval(timer);
    }, [resendIn]);

    useEffect(() => {
        if (!verified) {
            return;
        }

        const timer = setTimeout(() => {
            router.replace("/portals");
        }, 1200);

        return () => clearTimeout(timer);
    }, [verified, router]);

    async function loadProfile() {
        setError("");

        const response = await fetch("/api/auth/profile", { method: "GET" });

        if (!response.ok) {
            return;
        }

        const data = (await response.json()) as ProfileApiResponse;
        const resolvedName = data.profile?.full_name ?? data.user.fullName ?? "";
        const resolvedPhone = data.profile?.pending_phone_e164 ?? data.profile?.phone_e164 ?? "";

        setFullName(resolvedName);
        setPhone(resolvedPhone);
        const isVerified = Boolean(data.profile?.phone_verified);
        setVerified(isVerified);

        if (isVerified) {
            setInfo("Mobile already verified. Redirecting to your dashboard...");
        }
    }

    function continueWithGoogle() {
        window.location.href = "/api/auth/google?next=/login";
    }

    async function handleSendOtp(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!phone.trim()) {
            setError("Phone number is required.");
            return;
        }

        setBusy(true);
        setInfo("");
        setError("");

        try {
            const upsertResponse = await fetch("/api/auth/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    intent: "login",
                    fullName,
                    phone,
                }),
            });

            const upsertResult = await upsertResponse.json();

            if (!upsertResponse.ok) {
                throw new Error(upsertResult.error ?? "Failed to update profile");
            }

            const sendOtpResponse = await fetch("/api/auth/otp/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone }),
            });

            const sendOtpResult = await sendOtpResponse.json();

            if (!sendOtpResponse.ok) {
                throw new Error(sendOtpResult.error ?? "Failed to send OTP");
            }

            setOtpSent(true);
            setVerified(false);
            setResendIn(30);
            setInfo("OTP sent successfully. Enter the code to complete login.");
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Failed to send OTP");
        } finally {
            setBusy(false);
        }
    }

    async function handleResendOtp() {
        if (!phone.trim() || resendIn > 0) {
            return;
        }

        setBusy(true);
        setInfo("");
        setError("");

        try {
            const sendOtpResponse = await fetch("/api/auth/otp/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone }),
            });

            const sendOtpResult = await sendOtpResponse.json();

            if (!sendOtpResponse.ok) {
                throw new Error(sendOtpResult.error ?? "Failed to resend OTP");
            }

            setResendIn(30);
            setInfo("A new OTP has been sent.");
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Failed to resend OTP");
        } finally {
            setBusy(false);
        }
    }

    async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!otpCode.trim()) {
            setError("Enter the OTP code.");
            return;
        }

        setBusy(true);
        setInfo("");
        setError("");

        try {
            const verifyResponse = await fetch("/api/auth/otp/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: otpCode.trim() }),
            });

            const verifyResult = await verifyResponse.json();

            if (!verifyResponse.ok) {
                throw new Error(verifyResult.error ?? "OTP verification failed");
            }

            setVerified(true);
            setInfo("Login completed. Mobile number verified.");
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "OTP verification failed");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="grid min-h-screen md:grid-cols-2">
            <div className="relative hidden md:block">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,106,0,0.45),transparent_45%),radial-gradient(circle_at_70%_80%,rgba(207,175,99,0.4),transparent_55%),#141414]" />
            </div>
            <div className="flex items-center justify-center bg-[#0B0B0B] p-6">
                <div className="glass-card w-full max-w-md rounded-3xl border border-[#CFAF63]/25 p-7">
                    <p className="text-sm uppercase tracking-[0.2em] text-[#CFAF63]">Login</p>
                    <h1 className="mt-2 font-(--font-heading) text-4xl text-[#F5F5F5]">Welcome Back</h1>

                    {loadingSession ? (
                        <p className="mt-6 text-[#F5F5F5]/80">Checking session...</p>
                    ) : !user ? (
                        <div className="mt-6 space-y-4">
                            <button
                                onClick={continueWithGoogle}
                                className="w-full rounded-full border border-[#CFAF63]/30 bg-[#121212] px-4 py-3 font-semibold text-[#F5F5F5] transition hover:border-[#FF6A00]"
                            >
                                Continue with Google
                            </button>
                            <p className="text-sm text-[#F5F5F5]/70">
                                New here?{" "}
                                <Link href="/signup" className="text-[#CFAF63] hover:text-[#FF6A00]">
                                    Create account
                                </Link>
                            </p>
                        </div>
                    ) : (
                        <>
                            <form onSubmit={handleSendOtp} className="mt-6 space-y-4">
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={fullName}
                                    onChange={(event) => setFullName(event.target.value)}
                                    className="w-full rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3"
                                />
                                <input
                                    type="tel"
                                    placeholder="Phone (+919876543210)"
                                    value={phone}
                                    onChange={(event) => setPhone(event.target.value)}
                                    className="w-full rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3"
                                />
                                <button
                                    type="submit"
                                    disabled={busy}
                                    className="w-full rounded-full bg-linear-to-r from-[#CFAF63] to-[#FF6A00] px-4 py-3 font-semibold text-[#111] disabled:opacity-70"
                                >
                                    {busy ? "Please wait..." : "Send OTP"}
                                </button>
                            </form>

                            {otpSent && (
                                <form onSubmit={handleVerifyOtp} className="mt-4 space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Enter OTP"
                                        value={otpCode}
                                        onChange={(event) => setOtpCode(event.target.value)}
                                        className="w-full rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3"
                                    />
                                    <button
                                        type="submit"
                                        disabled={busy}
                                        className="w-full rounded-full border border-[#CFAF63]/40 px-4 py-3 font-semibold text-[#F5F5F5] disabled:opacity-70"
                                    >
                                        {busy ? "Verifying..." : "Verify OTP"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={busy || resendIn > 0}
                                        className="w-full rounded-full border border-[#CFAF63]/20 px-4 py-3 text-sm font-semibold text-[#F5F5F5]/90 disabled:opacity-60"
                                    >
                                        {resendIn > 0 ? `Resend OTP in ${resendIn}s` : "Resend OTP"}
                                    </button>
                                </form>
                            )}
                        </>
                    )}

                    {info && <p className="mt-4 text-sm text-emerald-300">{info}</p>}
                    {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
                    {verified && (
                        <p className="mt-3 text-sm text-[#CFAF63]">Verification complete. You are logged in. Redirecting...</p>
                    )}
                </div>
            </div>
        </div>
    );
}
