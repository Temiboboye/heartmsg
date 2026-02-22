-- Add is_paid column to inbox_messages if it doesn't exist
-- Free (non-premium) messages are visible immediately (is_paid = 1 by default)
-- Premium messages require payment before showing (is_paid = 0 until webhook fires)
ALTER TABLE inbox_messages ADD COLUMN is_paid INTEGER DEFAULT 1;

-- Fix existing premium messages that were created before this column existed
-- (They have a payment_reference so they were paid — mark them as paid)
UPDATE inbox_messages SET is_paid = 1 WHERE payment_reference IS NOT NULL;

-- Free messages (is_premium = 0) are always visible
UPDATE inbox_messages SET is_paid = 1 WHERE is_premium = 0;
