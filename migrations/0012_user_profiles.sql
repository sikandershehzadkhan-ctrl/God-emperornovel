ALTER TABLE users ADD COLUMN display_name TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN bio TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN avatar_url TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN website_url TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN location TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN profile_visibility TEXT NOT NULL DEFAULT 'private' CHECK(profile_visibility IN ('public','private'));
ALTER TABLE users ADD COLUMN show_reading_stats INTEGER NOT NULL DEFAULT 0 CHECK(show_reading_stats IN (0,1));
ALTER TABLE users ADD COLUMN profile_updated_at TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_users_profile_visibility ON users(profile_visibility, username);
