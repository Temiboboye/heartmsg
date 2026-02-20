import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { DB } = getRequestContext().env as unknown as CloudflareEnv;
        const { id } = await params;

        // 1. Fetch story by ID or Custom Slug
        const story = await DB.prepare('SELECT * FROM stories WHERE id = ? OR custom_slug = ?')
            .bind(id, id)
            .first<any>();

        if (!story) {
            return NextResponse.json({ error: 'Story not found' }, { status: 404 });
        }

        // 2. Fetch slides using the resolved story ID
        const { results: slides } = await DB.prepare(
            'SELECT * FROM slides WHERE story_id = ? ORDER BY "order" ASC'
        )
            .bind(story.id)
            .all<any>();

        let parsedAddons = [];
        try {
            parsedAddons = JSON.parse(story.addons || '[]');
        } catch (e) {
            parsedAddons = [];
        }

        return NextResponse.json({
            id: story.id,
            themeId: story.theme_id,
            fontId: story.font_id,
            musicId: story.music_id,
            isPaid: !!story.is_paid,
            created_at: story.created_at,
            addons: parsedAddons,
            customSlug: story.custom_slug,
            slides: slides.map(s => ({
                id: s.id,
                content: s.content,
                imageUrl: s.image_url
            }))
        });
    } catch (error: any) {
        console.error('Error fetching story:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
