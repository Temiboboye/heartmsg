import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';
import { InboxData, InboxMessageData } from '@/lib/types';

export const runtime = 'edge';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { DB } = getRequestContext().env as unknown as CloudflareEnv;
        const { username } = await params;

        const cleanUsername = username.toLowerCase();

        // Fetch inbox and their total earned (from wallets)
        const inboxRow = await DB.prepare(`
            SELECT i.id, i.username, i.created_at, w.total_earned
            FROM inboxes i
            LEFT JOIN wallets w ON i.id = w.inbox_id
            WHERE i.username = ?
        `)
            .bind(cleanUsername)
            .first<InboxData & { total_earned?: number }>();

        if (!inboxRow) {
            return NextResponse.json({ error: 'Inbox not found' }, { status: 404 });
        }

        const inbox = {
            id: inboxRow.id,
            username: inboxRow.username,
            created_at: inboxRow.created_at,
            total_earned: inboxRow.total_earned || 0
        };

        // Fetch messages
        const { results: messages } = await DB.prepare(`
            SELECT id, sender_name, content, is_premium, addons, created_at 
            FROM inbox_messages 
            WHERE inbox_id = ? AND is_paid = 1
            ORDER BY created_at DESC
        `)
            .bind(inbox.id)
            .all<any>();

        const formattedMessages = messages.map(msg => ({
            ...msg,
            is_premium: !!msg.is_premium,
            addons: JSON.parse(msg.addons || '[]')
        }));

        return NextResponse.json({
            inbox,
            messages: formattedMessages
        });

    } catch (error: any) {
        console.error('Error fetching inbox:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
