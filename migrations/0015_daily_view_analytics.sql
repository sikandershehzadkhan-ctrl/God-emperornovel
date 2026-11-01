-- Daily aggregate view requests. No reader identity or personal history is stored.
CREATE TABLE IF NOT EXISTS novel_view_daily (
  novel_id INTEGER NOT NULL,
  view_date TEXT NOT NULL,
  view_requests INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(novel_id, view_date)
);
CREATE TABLE IF NOT EXISTS chapter_view_daily (
  chapter_id INTEGER NOT NULL,
  view_date TEXT NOT NULL,
  view_requests INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(chapter_id, view_date)
);
CREATE INDEX IF NOT EXISTS idx_novel_view_daily_date ON novel_view_daily(view_date, novel_id);
CREATE INDEX IF NOT EXISTS idx_chapter_view_daily_date ON chapter_view_daily(view_date, chapter_id);
