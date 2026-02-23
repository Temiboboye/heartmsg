import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as { inboxId: string, subscription: any };
        const { inboxId, subscription } = body;

        if (!inboxId || !subscription || !subscription.endpoint || !subscription.keys) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { env } = getRequestContext() as { env: CloudflareEnv };

        // Use the endpoint URL as a pseudo-unique ID for the subscription
        // to prevent duplicate inserts for the same browser
        const id = crypto.randomUUID();

        // Ensure we don't insert the exact same endpoint twice
        const existing = await env.DB.prepare('SELECT id FROM push_subscriptions WHERE endpoint = ?')
            .bind(subscription.endpoint)
            .first();

        if (existing) {
            // Already subscribed
            return NextResponse.json({ success: true, message: "Already subscribed" });
        }

        await env.DB.prepare(`
            INSERT INTO push_subscriptions (id, inbox_id, endpoint, p256dh, auth)
            VALUES (?, ?, ?, ?, ?)
        `).bind(
            id,
            inboxId,
            subscription.endpoint,
            subscription.keys.p256dh,
            subscription.keys.auth
        ).run();

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Push subscribe error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
