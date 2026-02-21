/**
 * Coin (Hearts) calculation utilities
 * Platform takes 70% cut — creator earns 30%
 * 100 Hearts = $1 / ₦1,000
 * Base $1 note → creator earns 30% = $0.30 → 30 Hearts
 * Each $0.50 add-on → creator earns 30% = $0.15 → 15 Hearts
 */

export const COINS_BASE = 30; // Hearts for a base premium note (30% of $1)
export const COINS_PER_ADDON = 15; // Hearts per add-on (30% of $0.50)
export const COINS_PER_DOLLAR = 100; // Exchange rate: 100 Hearts = $1
export const MIN_WITHDRAWAL_COINS = 500; // Minimum 500 Hearts ($5) to withdraw

/**
 * Calculate how many Hearts to credit for a completed payment.
 */
export function calculateCoins(addons: string[] = []): number {
    return COINS_BASE + addons.length * COINS_PER_ADDON;
}

/**
 * Convert Hearts to USD display string.
 */
export function coinsToUsd(coins: number): string {
    return `$${(coins / COINS_PER_DOLLAR).toFixed(2)}`;
}

/**
 * Convert Hearts to NGN display string.
 */
export function coinsToNgn(coins: number): string {
    return `₦${(coins).toLocaleString()}`;
}
