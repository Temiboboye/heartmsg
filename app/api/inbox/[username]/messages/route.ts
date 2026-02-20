import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';
import { AddonId } from '@/lib/types';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'edge';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    // Basic IP Rate Limiting (10 requests per minute)
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const rl = checkRateLimit(ip, 10, 60000);
    if (!rl.success) {
        return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    try {
        const { DB } = getRequestContext().env as unknown as CloudflareEnv;
        const { username } = await params;
        const body = await request.json() as {
            content: string;
            sender_name?: string;
            is_premium?: boolean;
            addons?: AddonId[];
            payment_reference?: string;
        };

        const cleanUsername = username.toLowerCase();

        // 1. Find the inbox
        const inbox = await DB.prepare('SELECT id FROM inboxes WHERE username = ?')
            .bind(cleanUsername)
            .first<{ id: string }>();

        if (!inbox) {
            return NextResponse.json({ error: 'Inbox not found' }, { status: 404 });
        }

        // 2. Basic validation
        if (!body.content || body.content.trim().length === 0) {
            return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
        }

        const messageId = crypto.randomUUID();

        // 3. Insert the message
        await DB.prepare(`
            INSERT INTO inbox_messages (id, inbox_id, sender_name, content, is_premium, addons, payment_reference)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
            .bind(
                messageId,
                inbox.id,
                body.sender_name || 'Anonymous',
                body.content,
                body.is_premium ? 1 : 0,
                JSON.stringify(body.addons || []),
                body.payment_reference || null
            )
            .run();

        return NextResponse.json({ success: true, messageId });

    } catch (error: any) {
        console.error('Error creating inbox message:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
