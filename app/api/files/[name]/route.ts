import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ name: string }> }
) {
    try {
        const { BUCKET } = getRequestContext().env as unknown as CloudflareEnv;
        const { name } = await params;

        const object = await BUCKET.get(name);

        if (!object) {
            return new Response('Not Found', { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);

        return new Response(object.body, {
            headers
        });
    } catch (error: any) {
        console.error('Error serving file from R2:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
