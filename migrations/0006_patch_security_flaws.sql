-- Add is_paid column to inbox_messages to prevent bypass
ALTER TABLE inbox_messages ADD COLUMN is_paid BOOLEAN DEFAULT 0;

-- Ensure custom_slugs are universally unique at the DB level to prevent race conditions
CREATE UNIQUE INDEX IF NOT EXISTS custom_slug_idx ON stories (custom_slug);
