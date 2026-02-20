import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
    try {
        const { text } = await request.json() as { text: string };

        if (!text) {
            return NextResponse.json({ error: 'No text provided' }, { status: 400 });
        }

        // Mock AI Optimization Logic (Local Heuristics)
        let optimized = text.trim();

        // 1. Capitalization
        optimized = optimized.charAt(0).toUpperCase() + optimized.slice(1);

        // 2. Romantic Enhancements
        const replacements: Record<string, string> = {
            "love": "cherish",
            "like": "adore",
            "happy": "overjoyed",
            "miss you": "long to see your face",
            "beautiful": "breathtaking",
            "good": "wonderful",
            "nice": "lovely"
        };

        Object.keys(replacements).forEach(key => {
            const regex = new RegExp(`\\b${key}\\b`, 'gi');
            optimized = optimized.replace(regex, replacements[key]);
        });

        // 3. Emoji Decoration (if not present)
        if (!optimized.match(/[\u{1F600}-\u{1F64F}]/u)) {
            const emojis = [" ❤️", " ✨", " 🌹", " 💖"];
            optimized += emojis[Math.floor(Math.random() * emojis.length)];
        }

        return NextResponse.json({ optimized });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
