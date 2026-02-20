import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
    try {
        const { DB } = getRequestContext().env as unknown as CloudflareEnv;
        const { username } = await request.json() as { username: string };

        if (!username || username.trim().length < 3) {
            return NextResponse.json({ error: 'Username must be at least 3 characters long' }, { status: 400 });
        }

        const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');

        const inboxId = crypto.randomUUID();

        // Check if exists
        const existing = await DB.prepare('SELECT id FROM inboxes WHERE username = ?')
            .bind(cleanUsername)
            .first();

        if (existing) {
            return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
        }

        await DB.prepare('INSERT INTO inboxes (id, username) VALUES (?, ?)')
            .bind(inboxId, cleanUsername)
            .run();

        return NextResponse.json({ id: inboxId, username: cleanUsername });

    } catch (error: any) {
        console.error('Error creating inbox:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
