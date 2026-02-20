interface CloudflareEnv {
    DB: D1Database;
    BUCKET: R2Bucket;
    STRIPE_SECRET_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
    PAYSTACK_SECRET_KEY: string;
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: string;
}
