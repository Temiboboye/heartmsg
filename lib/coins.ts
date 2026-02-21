/**
 * Coin (Hearts) calculation utilities
 * 100 Hearts = $1 / ₦1,000
 * Platform keeps 30%, creator earns 70% → 50 Hearts base + 10 per add-on
 */

export const COINS_BASE = 50; // Hearts for a base premium note
export const COINS_PER_ADDON = 10; // Hearts per add-on selected
export const COINS_PER_DOLLAR = 100; // Exchange rate
export const MIN_WITHDRAWAL_COINS = 500; // Minimum 500 Hearts to withdraw

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
