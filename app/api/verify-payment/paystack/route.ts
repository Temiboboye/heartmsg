import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function POST(request: NextRequest) {
    try {
        const { reference, storyId } = await request.json() as { reference: string; storyId: string };
        const { env } = getRequestContext() as { env: CloudflareEnv };

        if (!env.PAYSTACK_SECRET_KEY) {
            throw new Error("Missing PAYSTACK_SECRET_KEY");
        }

        // Verify with Paystack
        const verifyUrl = `https://api.paystack.co/transaction/verify/${reference}`;
        const response = await fetch(verifyUrl, {
            headers: {
                'Authorization': `Bearer ${env.PAYSTACK_SECRET_KEY}`,
            },
        });

        const data = await response.json() as { status: boolean; data: { status: string; amount: number; reference: string } };

        if (!data.status || data.data.status !== "success") {
            return NextResponse.json({ success: false, message: "Transaction verification failed" });
        }

        // Success - Unlock Story
        await env.DB.prepare(
            'UPDATE stories SET is_paid = true, paystack_reference = ? WHERE id = ?'
        ).bind(data.data.reference, storyId).run();

        return NextResponse.json({ success: true, storyId });

    } catch (error: any) {
        console.error("Paystack Verify Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
