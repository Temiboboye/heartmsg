import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { INBOX_ADDONS_USD } from "@/lib/types";

export const runtime = "edge";

export async function POST(request: NextRequest) {
    try {
        const { messageId, addons = [], email, username } = await request.json() as { messageId: string; addons?: string[]; email?: string, username: string };
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
                        name: 'Premium Inbox Note',
                        description: 'A special, beautifully crafted message.',
                    },
                    unit_amount: 100, // $1.00 Base Price
                },
                quantity: 1,
            }
        ];

        // Add Add-ons
        if (addons && Array.isArray(addons)) {
            addons.forEach(addonId => {
                const addonDetails = INBOX_ADDONS_USD.find(a => a.id === addonId);
                if (addonDetails) {
                    line_items.push({
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: `Add-on: ${addonDetails.name}`,
                            },
                            unit_amount: Math.round(addonDetails.price * 100),
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
            success_url: `${origin}/inbox/${username}?success=true`,
            cancel_url: `${origin}/send/${username}?canceled=true`,
            metadata: {
                messageId: messageId,
                type: 'inbox_message'
            },
        });

        // Update DB with session ID
        await env.DB.prepare(
            'UPDATE inbox_messages SET payment_reference = ? WHERE id = ?'
        ).bind(session.id, messageId).run();

        return NextResponse.json({ url: session.url, sessionId: session.id });

    } catch (err: any) {
        console.error("Inbox Checkout Error:", err);
        return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
    }
}
