import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
    try {
        const { BUCKET } = getRequestContext().env as unknown as CloudflareEnv;
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const arrayBuffer = await file.arrayBuffer();

        await BUCKET.put(fileName, arrayBuffer, {
            httpMetadata: { contentType: file.type }
        });

        // In a real R2 setup, you would have a public URL or a worker serving the files.
        // For local dev, we can simulate the URL or use a local serve route.
        // For now, let's assume the files are served at /api/files/[name]
        const url = `/api/files/${fileName}`;

        return NextResponse.json({ url });
    } catch (error: any) {
        console.error('Error uploading to R2:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
