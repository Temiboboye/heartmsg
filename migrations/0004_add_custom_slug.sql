ALTER TABLE stories ADD COLUMN custom_slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_stories_custom_slug ON stories(custom_slug);
