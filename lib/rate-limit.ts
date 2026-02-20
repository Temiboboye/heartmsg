// Simple in-memory map for basic isolate-level rate limiting on Cloudflare Pages.
// Note: This data only persists for the lifetime of the specific V8 isolate handling the request,
// but it is highly effective against basic script-kiddie spam from a single IP.

type RateLimitInfo = {
    count: number;
    resetTime: number;
};

const ipMap = new Map<string, RateLimitInfo>();

export function checkRateLimit(
    ip: string,
    limit: number = 5,
    windowMs: number = 60000
): { success: boolean; limit: number; remaining: number; reset: number } {
    const now = Date.now();
    let info = ipMap.get(ip);

    // Clean up expired entries occasionally to prevent memory leaks in the isolate
    if (Math.random() < 0.1) {
        for (const [key, value] of ipMap.entries()) {
            if (now > value.resetTime) {
                ipMap.delete(key);
            }
        }
    }

    if (!info || now > info.resetTime) {
        info = { count: 1, resetTime: now + windowMs };
        ipMap.set(ip, info);
        return { success: true, limit, remaining: limit - 1, reset: info.resetTime };
    }

    if (info.count >= limit) {
        return { success: false, limit, remaining: 0, reset: info.resetTime };
    }

    info.count++;
    return { success: true, limit, remaining: limit - info.count, reset: info.resetTime };
}
