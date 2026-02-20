DROP TABLE IF EXISTS inbox_messages;
DROP TABLE IF EXISTS inboxes;

CREATE TABLE inboxes (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inbox_messages (
    id TEXT PRIMARY KEY,
    inbox_id TEXT NOT NULL,
    sender_name TEXT DEFAULT 'Anonymous',
    content TEXT NOT NULL,
    is_premium BOOLEAN DEFAULT FALSE,
    addons TEXT DEFAULT '[]',
    payment_reference TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inbox_id) REFERENCES inboxes(id) ON DELETE CASCADE
);

CREATE INDEX idx_inbox_username ON inboxes(username);
CREATE INDEX idx_messages_inbox_id ON inbox_messages(inbox_id);
