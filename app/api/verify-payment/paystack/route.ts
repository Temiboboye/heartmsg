import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { calculateCoins } from "@/lib/coins";

export const runtime = "edge";

export async function POST(request: NextRequest) {
    try {
        const { reference, storyId, messageId, addons = [] } = await request.json() as {
            reference: string;
            storyId?: string;
            messageId?: string;
            addons?: string[];
        };
        const { env } = getRequestContext() as { env: CloudflareEnv };

        if (!env.PAYSTACK_SECRET_KEY) {
            throw new Error("Missing PAYSTACK_SECRET_KEY");
        }

        // Verify with Paystack
        const verifyUrl = `https://api.paystack.co/transaction/verify/${reference}`;
        const response = await fetch(verifyUrl, {
            headers: { 'Authorization': `Bearer ${env.PAYSTACK_SECRET_KEY}` },
        });

        const data = await response.json() as {
            status: boolean;
            data: { status: string; amount: number; reference: string; metadata?: { messageId?: string; addons?: string[]; type?: string } }
        };

        if (!data.status || data.data.status !== "success") {
            return NextResponse.json({ success: false, message: "Transaction verification failed" });
        }

        const meta = data.data.metadata || {};
        const resolvedMessageId = messageId || meta.messageId;
        const resolvedAddons: string[] = addons.length ? addons : (meta.addons || []);

        if (resolvedMessageId || meta.type === 'inbox_message') {
            // Inbox message payment
            await env.DB.prepare(
                'UPDATE inbox_messages SET is_paid = 1, payment_reference = ? WHERE id = ?'
            ).bind(data.data.reference, resolvedMessageId).run();

            // Credit Hearts
            if (resolvedMessageId) {
                const msg = await env.DB.prepare(
                    'SELECT inbox_id, coins_credited FROM inbox_messages WHERE id = ?'
                ).bind(resolvedMessageId).first<{ inbox_id: string; coins_credited: number }>();

                if (msg && !msg.coins_credited) {
                    const coins = calculateCoins(resolvedAddons);
                    let wallet = await env.DB.prepare(
                        'SELECT id FROM wallets WHERE inbox_id = ?'
                    ).bind(msg.inbox_id).first<{ id: string }>();

                    if (!wallet) {
                        const walletId = crypto.randomUUID();
                        await env.DB.prepare(
                            'INSERT INTO wallets (id, inbox_id, coins, total_earned) VALUES (?, ?, ?, ?)'
                        ).bind(walletId, msg.inbox_id, coins, coins).run();
                        wallet = { id: walletId };
                    } else {
                        await env.DB.prepare(
                            'UPDATE wallets SET coins = coins + ?, total_earned = total_earned + ? WHERE id = ?'
                        ).bind(coins, coins, wallet.id).run();
                    }

                    await env.DB.prepare(
                        'INSERT INTO coin_transactions (id, wallet_id, type, amount, reason, reference) VALUES (?, ?, ?, ?, ?, ?)'
                    ).bind(crypto.randomUUID(), wallet.id, 'earn', coins, 'Premium note received', reference).run();

                    await env.DB.prepare(
                        'UPDATE inbox_messages SET coins_credited = 1 WHERE id = ?'
                    ).bind(resolvedMessageId).run();
                }
            }

            return NextResponse.json({ success: true, messageId: resolvedMessageId });
        } else if (storyId) {
            // Story payment
            await env.DB.prepare(
                'UPDATE stories SET is_paid = true, paystack_reference = ? WHERE id = ?'
            ).bind(data.data.reference, storyId).run();

            return NextResponse.json({ success: true, storyId });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Paystack Verify Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
