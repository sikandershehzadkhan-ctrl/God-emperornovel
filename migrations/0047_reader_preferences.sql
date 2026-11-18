-- Account-scoped reader preferences for cross-device continuity.
CREATE TABLE IF NOT EXISTS reader_preferences (
  user_id INTEGER PRIMARY KEY,
  preferences_json TEXT NOT NULL DEFAULT '{}'
    CHECK (json_valid(preferences_json) AND length(preferences_json) <= 2048),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
