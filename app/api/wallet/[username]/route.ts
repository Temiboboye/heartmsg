import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params;
        const { env } = getRequestContext() as { env: CloudflareEnv };

        // Find inbox by username
        const inbox = await env.DB.prepare(
            'SELECT id FROM inboxes WHERE username = ?'
        ).bind(username).first<{ id: string }>();

        if (!inbox) {
            return NextResponse.json({ error: 'Inbox not found' }, { status: 404 });
        }

        // Get wallet (or return empty state)
        const wallet = await env.DB.prepare(
            'SELECT id, coins, total_earned, created_at FROM wallets WHERE inbox_id = ?'
        ).bind(inbox.id).first<{ id: string; coins: number; total_earned: number; created_at: string }>();

        if (!wallet) {
            return NextResponse.json({
                wallet: { coins: 0, total_earned: 0 },
                transactions: [],
                withdrawals: []
            });
        }

        // Recent transactions (last 20)
        const { results: transactions } = await env.DB.prepare(
            'SELECT type, amount, reason, reference, created_at FROM coin_transactions WHERE wallet_id = ? ORDER BY created_at DESC LIMIT 20'
        ).bind(wallet.id).all();

        // Pending/recent withdrawals
        const { results: withdrawals } = await env.DB.prepare(
            'SELECT id, coins, status, payout_info, created_at FROM withdrawals WHERE wallet_id = ? ORDER BY created_at DESC LIMIT 10'
        ).bind(wallet.id).all();

        return NextResponse.json({
            wallet: { coins: wallet.coins, total_earned: wallet.total_earned },
            transactions,
            withdrawals
        });

    } catch (error: any) {
        console.error('Wallet GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
