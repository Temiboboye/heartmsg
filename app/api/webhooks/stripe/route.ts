import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function POST(request: NextRequest) {
    let event: Stripe.Event;

    try {
        const { env } = getRequestContext() as { env: CloudflareEnv };
        if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
            throw new Error("Missing Stripe configuration");
        }

        const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
            apiVersion: '2025-01-27.acacia' as any,
        });

        const signature = request.headers.get("stripe-signature");
        if (!signature) {
            return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
        }

        const body = await request.text();
        // const event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
        // For debugging deployment, let's skip signature verification for a moment if it causes the crash, but actually the crash is on "Publish", so it's build time/deploy time.
        // Let's try to use the crypto web api for verification if stripe sdk fails?
        // No, let's just keep strict verification but ensure we are handling the promise correctly.
        event = await stripe.webhooks.constructEventAsync(body, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: err.message }, { status: 400 });
    }

    try {
        const { env } = getRequestContext() as { env: CloudflareEnv };
        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            const storyId = session.metadata?.storyId;
            const messageId = session.metadata?.messageId;
            const type = session.metadata?.type;

            if (type === 'inbox_message' && messageId) {
                console.log(`Payment successful for inbox message ${messageId}`);
                await env.DB.prepare(
                    'UPDATE inbox_messages SET is_paid = 1 WHERE id = ?'
                ).bind(messageId).run();
            } else if (storyId) {
                console.log(`Payment successful for story ${storyId}`);
                // In D1 boolean is often stored as 1/0, but we can bind TRUE/1.
                await env.DB.prepare(
                    'UPDATE stories SET is_paid = 1 WHERE id = ?'
                ).bind(storyId).run();
            }
        }

        return NextResponse.json({ received: true });
    } catch (err: any) {
        console.error(`Webhook handler failed: ${err.message}`);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
