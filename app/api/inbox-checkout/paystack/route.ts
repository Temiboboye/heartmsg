import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { INBOX_ADDONS_NGN } from "@/lib/types";

export const runtime = "edge";

const INBOX_BASE_PRICE_NGN = 1000; // ₦1,000

export async function POST(request: NextRequest) {
    try {
        const { messageId, addons = [], email, username } = await request.json() as {
            messageId: string;
            addons?: string[];
            email: string;
            username: string;
        };

        const { env } = getRequestContext() as { env: CloudflareEnv };

        if (!env.PAYSTACK_SECRET_KEY) {
            throw new Error("Missing PAYSTACK_SECRET_KEY");
        }

        if (!email) {
            throw new Error("Email is required for Paystack payment");
        }

        // Calculate total amount in Kobo (NGN * 100)
        let totalNgn = INBOX_BASE_PRICE_NGN;
        addons.forEach((addonId) => {
            const addon = INBOX_ADDONS_NGN.find((a) => a.id === addonId);
            if (addon) totalNgn += addon.price;
        });
        const amountKobo = totalNgn * 100;

        const origin = request.headers.get("origin") || "https://ourlovenotes.pages.dev";
        const callbackUrl = `${origin}/inbox/${username}?paystack_success=true`;

        // Initialize Paystack Transaction
        const response = await fetch("https://api.paystack.co/transaction/initialize", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                amount: amountKobo,
                callback_url: callbackUrl,
                metadata: {
                    messageId,
                    username,
                    addons,
                    type: "inbox_message",
                },
            }),
        });

        const data = await response.json() as {
            status: boolean;
            data: { authorization_url: string; reference: string };
        };

        if (!data.status) {
            throw new Error("Failed to initialize Paystack transaction");
        }

        // Save reference to DB
        await env.DB.prepare(
            "UPDATE inbox_messages SET payment_reference = ? WHERE id = ?"
        ).bind(data.data.reference, messageId).run();

        return NextResponse.json({ url: data.data.authorization_url, reference: data.data.reference });

    } catch (error: any) {
        console.error("Paystack Inbox Checkout Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
