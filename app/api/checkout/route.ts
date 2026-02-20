import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

const ADDON_NAMES: Record<string, string> = {
    'no-watermark': 'No Watermark',
    'elegant-font': 'Elegant Font',
    'romantic-music': 'Romantic Love Track',
    'effects': 'Special Effects',
    'custom-link': 'Custom Link',
};

export async function POST(request: NextRequest) {
    try {
        const { storyId, addons = [], email, numPages = 1 } = await request.json() as { storyId: string; addons?: string[]; email?: string; numPages?: number };
        const { env } = getRequestContext() as { env: CloudflareEnv };

        if (!env.STRIPE_SECRET_KEY) {
            throw new Error("Missing STRIPE_SECRET_KEY");
        }

        const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
            apiVersion: '2025-01-27.acacia' as any,
        });

        const origin = request.headers.get("origin") || "http://localhost:3000";

        // Construct Line Items
        const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Love Story Letter',
                        description: 'Your beautifully crafted digital story.',
                    },
                    unit_amount: 100, // $1.00 Base Price
                },
                quantity: 1,
            }
        ];

        // Add Extra Pages
        const extraPages = Math.max(0, numPages - 1);
        if (extraPages > 0) {
            line_items.push({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `Extra Page${extraPages > 1 ? 's' : ''}`,
                    },
                    unit_amount: 50, // $0.50 per extra page
                },
                quantity: extraPages,
            });
        }

        // Add Add-ons
        if (addons && Array.isArray(addons)) {
            addons.forEach(addonId => {
                const name = ADDON_NAMES[addonId];
                if (name) {
                    line_items.push({
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: `Add-on: ${name}`,
                            },
                            unit_amount: 50, // $0.50 per Add-on
                        },
                        quantity: 1,
                    });
                }
            });
        }

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            line_items,
            customer_email: email,
            mode: 'payment',
            success_url: `${origin}/story/${storyId}?success=true`,
            cancel_url: `${origin}/story/${storyId}?canceled=true`,
            metadata: {
                storyId: storyId,
            },
        });

        // Update DB with session ID
        await env.DB.prepare(
            'UPDATE stories SET stripe_session_id = ? WHERE id = ?'
        ).bind(session.id, storyId).run();

        return NextResponse.json({ url: session.url, sessionId: session.id });

    } catch (err: any) {
        console.error("Checkout Error:", err);
        return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
    }
}
