-- Create the stories table
CREATE TABLE stories (
    id TEXT PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    theme_id TEXT NOT NULL,
    font_id TEXT NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    stripe_session_id TEXT
);

-- Create the slides table
CREATE TABLE slides (
    id TEXT PRIMARY KEY,
    story_id TEXT REFERENCES stories(id) ON DELETE CASCADE,
    content TEXT,
    image_url TEXT,
    "order" INTEGER NOT NULL
);
