export function createRuntimeFeatureSchemaEnsurer() {
  let ready = null;
  return async function ensureRuntimeFeatureSchema(env) {
    if (!ready) ready = (async () => {
      const marker = await env.DB.prepare("SELECT value FROM app_settings WHERE key='runtime_feature_schema_version' LIMIT 1").first();
      if (marker?.value === "2") return;

      const statements = [
        "CREATE TABLE IF NOT EXISTS auth_rate_limits (scope TEXT NOT NULL,key_hash TEXT NOT NULL,window_start INTEGER NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(scope,key_hash))",
        "CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_window ON auth_rate_limits(window_start)",
        "CREATE TABLE IF NOT EXISTS comment_likes (user_id INTEGER NOT NULL,comment_id INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id,comment_id),FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(comment_id) REFERENCES comments(id) ON DELETE CASCADE)",
        "CREATE TABLE IF NOT EXISTS comment_reports (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,comment_id INTEGER NOT NULL,reason TEXT NOT NULL,details TEXT DEFAULT '',status TEXT NOT NULL DEFAULT 'open',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,comment_id),FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(comment_id) REFERENCES comments(id) ON DELETE CASCADE)",
        "CREATE TABLE IF NOT EXISTS novel_reactions (user_id INTEGER NOT NULL,novel_id INTEGER NOT NULL,reaction TEXT NOT NULL CHECK(reaction IN ('love','fire','laugh','sad','clap')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id,novel_id),FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE)",
        "CREATE INDEX IF NOT EXISTS idx_novel_reactions_novel ON novel_reactions(novel_id,reaction)",
        "CREATE TABLE IF NOT EXISTS request_votes (request_id INTEGER NOT NULL,user_id INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(request_id,user_id),FOREIGN KEY(request_id) REFERENCES novel_requests(id) ON DELETE CASCADE,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)",
        "CREATE INDEX IF NOT EXISTS idx_request_votes_request ON request_votes(request_id)",
        "CREATE TABLE IF NOT EXISTS comment_reports_legacy_duplicates (id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,comment_id INTEGER NOT NULL,reason TEXT NOT NULL,details TEXT DEFAULT '',status TEXT NOT NULL DEFAULT 'open',created_at TEXT NOT NULL,archived_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
        "INSERT OR IGNORE INTO comment_reports_legacy_duplicates(id,user_id,comment_id,reason,details,status,created_at) SELECT id,user_id,comment_id,reason,details,status,created_at FROM comment_reports WHERE rowid NOT IN (SELECT MIN(rowid) FROM comment_reports GROUP BY user_id,comment_id)",
        "DELETE FROM comment_reports WHERE rowid NOT IN (SELECT MIN(rowid) FROM comment_reports GROUP BY user_id,comment_id)",
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_comment_reports_user_comment ON comment_reports(user_id,comment_id)",
        "CREATE INDEX IF NOT EXISTS idx_comment_reports_status_created ON comment_reports(status,created_at)",
"CREATE TRIGGER IF NOT EXISTS trg_comment_likes_validate_insert\nBEFORE INSERT ON comment_likes\nWHEN NOT EXISTS (SELECT 1 FROM users WHERE id=NEW.user_id)\n  OR NOT EXISTS (SELECT 1 FROM comments WHERE id=NEW.comment_id)\nBEGIN SELECT RAISE(ABORT,'comment_likes parent missing'); END;",
"CREATE TRIGGER IF NOT EXISTS trg_comment_likes_validate_update\nBEFORE UPDATE OF user_id,comment_id ON comment_likes\nWHEN NOT EXISTS (SELECT 1 FROM users WHERE id=NEW.user_id)\n  OR NOT EXISTS (SELECT 1 FROM comments WHERE id=NEW.comment_id)\nBEGIN SELECT RAISE(ABORT,'comment_likes parent missing'); END;",
"CREATE TRIGGER IF NOT EXISTS trg_comment_likes_user_cascade\nAFTER DELETE ON users\nBEGIN DELETE FROM comment_likes WHERE user_id=OLD.id; END;",
"CREATE TRIGGER IF NOT EXISTS trg_comment_likes_comment_cascade\nAFTER DELETE ON comments\nBEGIN DELETE FROM comment_likes WHERE comment_id=OLD.id; END;",
"CREATE TRIGGER IF NOT EXISTS trg_comment_reports_validate_insert\nBEFORE INSERT ON comment_reports\nWHEN NOT EXISTS (SELECT 1 FROM users WHERE id=NEW.user_id)\n  OR NOT EXISTS (SELECT 1 FROM comments WHERE id=NEW.comment_id)\nBEGIN SELECT RAISE(ABORT,'comment_reports parent missing'); END;",
"CREATE TRIGGER IF NOT EXISTS trg_comment_reports_validate_update\nBEFORE UPDATE OF user_id,comment_id ON comment_reports\nWHEN NOT EXISTS (SELECT 1 FROM users WHERE id=NEW.user_id)\n  OR NOT EXISTS (SELECT 1 FROM comments WHERE id=NEW.comment_id)\nBEGIN SELECT RAISE(ABORT,'comment_reports parent missing'); END;",
"CREATE TRIGGER IF NOT EXISTS trg_comment_reports_user_cascade\nAFTER DELETE ON users\nBEGIN DELETE FROM comment_reports WHERE user_id=OLD.id; END;",
"CREATE TRIGGER IF NOT EXISTS trg_comment_reports_comment_cascade\nAFTER DELETE ON comments\nBEGIN DELETE FROM comment_reports WHERE comment_id=OLD.id; END;",
"CREATE TRIGGER IF NOT EXISTS trg_novel_reactions_validate_insert\nBEFORE INSERT ON novel_reactions\nWHEN NOT EXISTS (SELECT 1 FROM users WHERE id=NEW.user_id)\n  OR NOT EXISTS (SELECT 1 FROM novels WHERE id=NEW.novel_id)\nBEGIN SELECT RAISE(ABORT,'novel_reactions parent missing'); END;",
"CREATE TRIGGER IF NOT EXISTS trg_novel_reactions_validate_update\nBEFORE UPDATE OF user_id,novel_id ON novel_reactions\nWHEN NOT EXISTS (SELECT 1 FROM users WHERE id=NEW.user_id)\n  OR NOT EXISTS (SELECT 1 FROM novels WHERE id=NEW.novel_id)\nBEGIN SELECT RAISE(ABORT,'novel_reactions parent missing'); END;",
"CREATE TRIGGER IF NOT EXISTS trg_novel_reactions_user_cascade\nAFTER DELETE ON users\nBEGIN DELETE FROM novel_reactions WHERE user_id=OLD.id; END;",
"CREATE TRIGGER IF NOT EXISTS trg_novel_reactions_novel_cascade\nAFTER DELETE ON novels\nBEGIN DELETE FROM novel_reactions WHERE novel_id=OLD.id; END;",
"CREATE TRIGGER IF NOT EXISTS trg_request_votes_validate_insert\nBEFORE INSERT ON request_votes\nWHEN NOT EXISTS (SELECT 1 FROM users WHERE id=NEW.user_id)\n  OR NOT EXISTS (SELECT 1 FROM novel_requests WHERE id=NEW.request_id)\nBEGIN SELECT RAISE(ABORT,'request_votes parent missing'); END;",
"CREATE TRIGGER IF NOT EXISTS trg_request_votes_validate_update\nBEFORE UPDATE OF user_id,request_id ON request_votes\nWHEN NOT EXISTS (SELECT 1 FROM users WHERE id=NEW.user_id)\n  OR NOT EXISTS (SELECT 1 FROM novel_requests WHERE id=NEW.request_id)\nBEGIN SELECT RAISE(ABORT,'request_votes parent missing'); END;",
"CREATE TRIGGER IF NOT EXISTS trg_request_votes_user_cascade\nAFTER DELETE ON users\nBEGIN DELETE FROM request_votes WHERE user_id=OLD.id; END;",
"CREATE TRIGGER IF NOT EXISTS trg_request_votes_request_cascade\nAFTER DELETE ON novel_requests\nBEGIN DELETE FROM request_votes WHERE request_id=OLD.id; END;"
      ];
      for (const sql of statements) await env.DB.prepare(sql).run();

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
