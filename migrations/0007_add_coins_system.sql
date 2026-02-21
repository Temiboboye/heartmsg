-- Phase 1: Add coins/wallets system
-- Wallet per inbox owner
CREATE TABLE IF NOT EXISTS wallets (
    id            TEXT PRIMARY KEY,
    inbox_id      TEXT UNIQUE NOT NULL,
    coins         INTEGER DEFAULT 0,
    total_earned  INTEGER DEFAULT 0,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inbox_id) REFERENCES inboxes(id) ON DELETE CASCADE
);

-- Audit log of every earn/spend event
CREATE TABLE IF NOT EXISTS coin_transactions (
    id          TEXT PRIMARY KEY,
    wallet_id   TEXT NOT NULL,
    type        TEXT NOT NULL CHECK(type IN ('earn', 'redeem')),
    amount      INTEGER NOT NULL,
    reason      TEXT,
    reference   TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
);

-- Withdrawal / cash-out requests
CREATE TABLE IF NOT EXISTS withdrawals (
    id          TEXT PRIMARY KEY,
    wallet_id   TEXT NOT NULL,
    coins       INTEGER NOT NULL,
    status      TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'paid', 'rejected')),
    payout_info TEXT DEFAULT '{}',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
);

-- Track if a message has been credited with coins
ALTER TABLE inbox_messages ADD COLUMN coins_credited INTEGER DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wallets_inbox_id ON wallets(inbox_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_wallet_id ON coin_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_wallet_id ON withdrawals(wallet_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
