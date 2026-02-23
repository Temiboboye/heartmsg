import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function GET(request: NextRequest) {
    try {
        const { env } = getRequestContext() as { env: CloudflareEnv };

        // Query the top 50 earners by joining wallets and inboxes
        // We only show users who have earned at least 1 Heart
        const { results } = await env.DB.prepare(`
            SELECT 
                i.username, 
                w.total_earned 
            FROM wallets w
            JOIN inboxes i ON w.inbox_id = i.id
            WHERE w.total_earned > 0
            ORDER BY w.total_earned DESC
            LIMIT 50
        `).all<{ username: string; total_earned: number }>();

        return NextResponse.json({
            success: true,
            leaderboard: results
        });

    } catch (error: any) {
        console.error('Leaderboard GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
