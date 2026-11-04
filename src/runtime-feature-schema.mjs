export function createRuntimeFeatureSchemaEnsurer() {
  let ready = null;
  return async function ensureRuntimeFeatureSchema(env) {
    if (!ready) ready = (async () => {
      const marker = await env.DB.prepare("SELECT value FROM app_settings WHERE key='runtime_feature_schema_version' LIMIT 1").first();
      if (marker?.value === "2") return;

      const statements = [
        "CREATE TABLE IF NOT EXISTS auth_rate_limits (scope TEXT NOT NULL,key_hash TEXT NOT NULL,window_start INTEGER NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(scope,key_hash))",
        "CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_window ON auth_rate_limits(window_start)",
        "CREATE TABLE IF NOT EXISTS community_rate_limit_events (id INTEGER PRIMARY KEY AUTOINCREMENT,scope TEXT NOT NULL CHECK(scope IN ('comment','report')),user_id INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
        "CREATE INDEX IF NOT EXISTS idx_community_rate_limit_scope_user_created ON community_rate_limit_events(scope,user_id,created_at)",
        "CREATE TABLE IF NOT EXISTS comment_report_claims (user_id INTEGER NOT NULL,comment_id INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id,comment_id))",
        "CREATE TABLE IF NOT EXISTS comment_likes (user_id INTEGER NOT NULL,comment_id INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id,comment_id))",
        "CREATE TABLE IF NOT EXISTS comment_reports (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,comment_id INTEGER NOT NULL,reason TEXT NOT NULL,details TEXT DEFAULT '',status TEXT NOT NULL DEFAULT 'open',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
        "CREATE TABLE IF NOT EXISTS novel_reactions (user_id INTEGER NOT NULL,novel_id INTEGER NOT NULL,reaction TEXT NOT NULL CHECK(reaction IN ('love','fire','laugh','sad','clap')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id,novel_id),FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE)",
        "CREATE INDEX IF NOT EXISTS idx_novel_reactions_novel ON novel_reactions(novel_id,reaction)",
        "CREATE TABLE IF NOT EXISTS request_votes (request_id INTEGER NOT NULL,user_id INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(request_id,user_id))",
        "CREATE INDEX IF NOT EXISTS idx_request_votes_request ON request_votes(request_id)"
      ];
      for (const sql of statements) await env.DB.prepare(sql).run();

      await env.DB.prepare("INSERT OR IGNORE INTO comment_report_claims(user_id,comment_id) SELECT DISTINCT user_id,comment_id FROM comment_reports").run();
      await env.DB.prepare(`CREATE TRIGGER IF NOT EXISTS trg_comments_hourly_limit
        BEFORE INSERT ON comments
        BEGIN
          SELECT CASE WHEN (SELECT COUNT(*) FROM community_rate_limit_events WHERE scope='comment' AND user_id=NEW.user_id AND created_at>=datetime('now','-1 hour')) >= 10
            THEN RAISE(ABORT,'comment_hourly_limit') END;
          INSERT INTO community_rate_limit_events(scope,user_id) VALUES('comment',NEW.user_id);
        END`).run();
      await env.DB.prepare(`CREATE TRIGGER IF NOT EXISTS trg_comment_reports_hourly_limit_and_claim
        BEFORE INSERT ON comment_reports
        BEGIN
          SELECT CASE WHEN (SELECT COUNT(*) FROM community_rate_limit_events WHERE scope='report' AND user_id=NEW.user_id AND created_at>=datetime('now','-1 hour')) >= 10
            THEN RAISE(ABORT,'comment_report_hourly_limit') END;
          INSERT INTO comment_report_claims(user_id,comment_id) VALUES(NEW.user_id,NEW.comment_id);
          INSERT INTO community_rate_limit_events(scope,user_id) VALUES('report',NEW.user_id);
        END`).run();

      for (const column of ["parent_id INTEGER", "edited_at TEXT"]) {
        try {
          await env.DB.prepare("ALTER TABLE comments ADD COLUMN " + column).run();
        } catch (error) {
          if (!/duplicate column name/i.test(String(error?.message || error))) throw error;
        }
      }

      await env.DB.prepare("DELETE FROM auth_rate_limits WHERE window_start<?")
        .bind(Math.floor(Date.now() / 1000) - 172800).run();
      await env.DB.prepare("INSERT OR REPLACE INTO app_settings(key,value) VALUES('runtime_feature_schema_version','2')").run();
    })();

    try {
      await ready;
    } catch (error) {
      ready = null;
      throw error;
    }
  };
}
