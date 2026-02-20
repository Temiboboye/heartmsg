import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

const ADDON_PRICES_NGN: Record<string, number> = {
    'no-watermark': 500,
    'elegant-font': 500,
    'romantic-music': 500,
    'effects': 500,
    'custom-link': 1000,
};

const BASE_PRICE_NGN = 1000;

export async function POST(request: NextRequest) {
    try {
        const { storyId, addons = [], email, numPages = 1 } = await request.json() as { storyId: string; addons?: string[]; email: string; numPages?: number };
        const { env } = getRequestContext() as { env: CloudflareEnv };

        if (!env.PAYSTACK_SECRET_KEY) {
            throw new Error("Missing PAYSTACK_SECRET_KEY");
        }

        // Calculate Amount in Kobo (Naira * 100)
        let totalAmountNgn = BASE_PRICE_NGN;

        // Add Add-ons
        addons.forEach(addonId => {
            if (ADDON_PRICES_NGN[addonId]) {
                totalAmountNgn += ADDON_PRICES_NGN[addonId];
            }
        });

        // Add Extra Pages Cost
        const extraPages = Math.max(0, numPages - 1);
        totalAmountNgn += extraPages * 500;

        const amountKobo = totalAmountNgn * 100;
        const origin = request.headers.get("origin") || "http://localhost:3000";
        const callbackUrl = `${origin}/story/${storyId}?payment_provider=paystack`;

        // Initialize Paystack Transaction
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                amount: amountKobo,
                callback_url: callbackUrl,
                metadata: {
                    storyId,
                    addons
                }
            })
        });

        const data = await response.json() as { status: boolean; data: { authorization_url: string; access_code: string; reference: string } };

        if (!data.status) {
            throw new Error("Failed to initialize Paystack transaction");
        }

        // Save Reference to DB
        await env.DB.prepare(
            'UPDATE stories SET paystack_reference = ? WHERE id = ?'
        ).bind(data.data.reference, storyId).run();

        return NextResponse.json({ url: data.data.authorization_url, reference: data.data.reference });

    } catch (error: any) {
        console.error("Paystack Init Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
