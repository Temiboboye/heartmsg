import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
    // Basic IP Rate Limiting (10 requests per minute)
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const rl = checkRateLimit(ip, 10, 60000);
    if (!rl.success) {
        return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    try {
        const { DB } = getRequestContext().env as unknown as CloudflareEnv;
        const { theme_id, font_id, music_id, slides, addons, email, customSlug } = await request.json() as {
            theme_id: string;
            font_id: string;
            music_id?: string;
            slides: any[];
            addons?: string[];
            email?: string;
            customSlug?: string;
        };

        const storyId = crypto.randomUUID();

        // 1. Insert story (relies on UNIQUE constraint for custom_slug)
        try {
            await DB.prepare(
                'INSERT INTO stories (id, theme_id, font_id, music_id, addons, email, custom_slug) VALUES (?, ?, ?, ?, ?, ?, ?)'
            )
                .bind(storyId, theme_id, font_id, music_id || null, JSON.stringify(addons || []), email || null, customSlug || null)
                .run();
        } catch (error: any) {
            if (error.message && error.message.includes('UNIQUE constraint failed')) {
                return NextResponse.json({ error: 'Custom link is already taken' }, { status: 409 });
            }
            throw error;
        }

        // 2. Insert slides
        const slideStatements = slides.map((slide: any) => {
            return DB.prepare(
                'INSERT INTO slides (id, story_id, content, image_url, "order") VALUES (?, ?, ?, ?, ?)'
            )
                .bind(crypto.randomUUID(), storyId, slide.content, slide.image_url ?? null, slide.order);
        });

        // Use batch for slides
        if (slideStatements.length > 0) {
            await DB.batch(slideStatements);
        }

        return NextResponse.json({ id: storyId });
    } catch (error: any) {
        console.error('Error creating story:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
