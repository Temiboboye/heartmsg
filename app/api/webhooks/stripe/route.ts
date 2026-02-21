import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { calculateCoins } from "@/lib/coins";

export const runtime = "edge";

async function creditCoinsForMessage(env: CloudflareEnv, messageId: string, addons: string[], reference: string) {
    // Get the message's inbox_id
    const msg = await env.DB.prepare(
        'SELECT inbox_id, coins_credited FROM inbox_messages WHERE id = ?'
    ).bind(messageId).first<{ inbox_id: string; coins_credited: number }>();

    if (!msg || msg.coins_credited) return; // Already credited

    const inbox = await env.DB.prepare(
        'SELECT id FROM inboxes WHERE id = ?'
    ).bind(msg.inbox_id).first<{ id: string }>();
    if (!inbox) return;

    // Get or create wallet
    let wallet = await env.DB.prepare(
        'SELECT id, coins, total_earned FROM wallets WHERE inbox_id = ?'
    ).bind(msg.inbox_id).first<{ id: string; coins: number; total_earned: number }>();

    const coins = calculateCoins(addons);

    if (!wallet) {
        const walletId = crypto.randomUUID();
        await env.DB.prepare(
            'INSERT INTO wallets (id, inbox_id, coins, total_earned) VALUES (?, ?, ?, ?)'
        ).bind(walletId, msg.inbox_id, coins, coins).run();
        wallet = { id: walletId, coins, total_earned: coins };
    } else {
        await env.DB.prepare(
            'UPDATE wallets SET coins = coins + ?, total_earned = total_earned + ? WHERE id = ?'
        ).bind(coins, coins, wallet.id).run();
    }

    // Record transaction
    await env.DB.prepare(
        'INSERT INTO coin_transactions (id, wallet_id, type, amount, reason, reference) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
        crypto.randomUUID(),
        wallet.id,
        'earn',
        coins,
        `Premium note received`,
        reference
    ).run();

    // Mark message as credited
    await env.DB.prepare(
        'UPDATE inbox_messages SET coins_credited = 1 WHERE id = ?'
    ).bind(messageId).run();

    console.log(`Credited ${coins} Hearts to wallet ${wallet.id} for message ${messageId}`);
}

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
            const addons = session.metadata?.addons ? JSON.parse(session.metadata.addons) : [];

            if (type === 'inbox_message' && messageId) {
                console.log(`Payment successful for inbox message ${messageId}`);
                await env.DB.prepare(
                    'UPDATE inbox_messages SET is_paid = 1 WHERE id = ?'
                ).bind(messageId).run();

                // Credit Hearts
                await creditCoinsForMessage(env, messageId, addons, session.id);
            } else if (storyId) {
                console.log(`Payment successful for story ${storyId}`);
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
