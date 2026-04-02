import "server-only";

import { getRequiredServerEnv } from "@/lib/env";
import { normalizeE164 } from "@/lib/phone";

const MSG91_SEND_OTP_URL = "https://api.msg91.com/api/sendotp.php";
const MSG91_VERIFY_OTP_URL = "https://api.msg91.com/api/verifyRequestOTP.php";

type Msg91Response = {
    type?: string;
    message?: string;
    error?: string;
};

export class Msg91Error extends Error {
    status: number;

    constructor(message: string, status = 502) {
        super(message);
        this.name = "Msg91Error";
        this.status = status;
    }
}

function getOptionalServerEnv(name: string): string | undefined {
    const value = process.env[name]?.trim();
    return value ? value : undefined;
}

function parseMsg91Response(raw: string): Msg91Response | null {
    if (!raw.trim()) {
        return null;
    }

    try {
        return JSON.parse(raw) as Msg91Response;
    } catch {
        return null;
    }
}

function getMsg91Message(payload: Msg91Response | null, raw: string): string {
    if (payload?.message) {
        return payload.message;
    }

    if (payload?.error) {
        return payload.error;
    }

    return raw.trim() || "MSG91 request failed.";
}

function toMsg91Mobile(phoneE164: string): string {
    return normalizeE164(phoneE164).replace(/^\+/, "");
}

async function requestMsg91(endpoint: string, params: URLSearchParams) {
    const response = await fetch(`${endpoint}?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
    });

    const raw = await response.text();
    const payload = parseMsg91Response(raw);
    const responseType = payload?.type?.toLowerCase();
    const message = getMsg91Message(payload, raw);

    if (!response.ok || responseType === "error") {
        throw new Msg91Error(message, response.ok ? 400 : response.status);
    }

    return payload;
}

export async function sendMsg91Otp(phoneE164: string) {
    const params = new URLSearchParams({
        authkey: getRequiredServerEnv("MSG91_AUTH_KEY"),
        mobile: toMsg91Mobile(phoneE164),
        otp_expiry: getOptionalServerEnv("MSG91_OTP_EXPIRY_MINUTES") ?? "10",
        otp_length: getOptionalServerEnv("MSG91_OTP_LENGTH") ?? "6",
    });

    const senderId = getOptionalServerEnv("MSG91_SENDER_ID");
    const customMessage = getOptionalServerEnv("MSG91_OTP_MESSAGE");

    if (senderId) {
        params.set("sender", senderId);
    }

    if (customMessage) {
        params.set("message", customMessage);
    }

    await requestMsg91(MSG91_SEND_OTP_URL, params);
}

export async function verifyMsg91Otp(phoneE164: string, otp: string) {
    const params = new URLSearchParams({
        authkey: getRequiredServerEnv("MSG91_AUTH_KEY"),
        mobile: toMsg91Mobile(phoneE164),
        otp,
    });

    await requestMsg91(MSG91_VERIFY_OTP_URL, params);
}
