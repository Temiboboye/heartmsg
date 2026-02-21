import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { MIN_WITHDRAWAL_COINS } from "@/lib/coins";

export const runtime = "edge";

export async function POST(request: NextRequest) {
    try {
        const { username, coins, payoutInfo } = await request.json() as {
            username: string;
            coins: number;
            payoutInfo: { bankName: string; accountNumber: string; accountName: string };
        };
        const { env } = getRequestContext() as { env: CloudflareEnv };

        if (!username || !coins || !payoutInfo) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (coins < MIN_WITHDRAWAL_COINS) {
            return NextResponse.json({ error: `Minimum withdrawal is ${MIN_WITHDRAWAL_COINS} Hearts` }, { status: 400 });
        }

        // Get inbox
        const inbox = await env.DB.prepare(
            'SELECT id FROM inboxes WHERE username = ?'
        ).bind(username).first<{ id: string }>();
        if (!inbox) return NextResponse.json({ error: 'Inbox not found' }, { status: 404 });

        // Get wallet
        const wallet = await env.DB.prepare(
            'SELECT id, coins FROM wallets WHERE inbox_id = ?'
        ).bind(inbox.id).first<{ id: string; coins: number }>();
        if (!wallet) return NextResponse.json({ error: 'No wallet found' }, { status: 404 });

        if (wallet.coins < coins) {
            return NextResponse.json({ error: 'Insufficient Hearts balance' }, { status: 400 });
        }

        // Deduct coins
        await env.DB.prepare(
            'UPDATE wallets SET coins = coins - ? WHERE id = ?'
        ).bind(coins, wallet.id).run();

        // Log redemption transaction
        await env.DB.prepare(
            'INSERT INTO coin_transactions (id, wallet_id, type, amount, reason) VALUES (?, ?, ?, ?, ?)'
        ).bind(crypto.randomUUID(), wallet.id, 'redeem', coins, 'Withdrawal request').run();

        // Create withdrawal record
        const withdrawalId = crypto.randomUUID();
        await env.DB.prepare(
            'INSERT INTO withdrawals (id, wallet_id, coins, status, payout_info) VALUES (?, ?, ?, ?, ?)'
        ).bind(withdrawalId, wallet.id, coins, 'pending', JSON.stringify(payoutInfo)).run();

        return NextResponse.json({ success: true, withdrawalId });

    } catch (error: any) {
        console.error('Wallet withdraw error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
