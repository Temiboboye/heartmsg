-- 0009_add_push_subscriptions.sql

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id TEXT PRIMARY KEY,
    inbox_id TEXT NOT NULL REFERENCES inboxes(id),
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookup when a message is inserted for an inbox
CREATE INDEX IF NOT EXISTS idx_push_subs_inbox_id ON push_subscriptions(inbox_id);
