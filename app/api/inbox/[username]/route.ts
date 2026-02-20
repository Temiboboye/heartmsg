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

        // Fetch inbox
        const inbox = await DB.prepare('SELECT id, username, created_at FROM inboxes WHERE username = ?')
            .bind(cleanUsername)
            .first<InboxData>();

        if (!inbox) {
            return NextResponse.json({ error: 'Inbox not found' }, { status: 404 });
        }

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
