import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const migration = readFileSync(new URL("../migrations/0010_email_verification.sql", import.meta.url), "utf8");
for (const requirement of [
  "ALTER TABLE users ADD COLUMN email_verified_at TEXT",
  "CREATE TABLE IF NOT EXISTS email_verification_tokens",
  "email_snapshot TEXT NOT NULL",
  "token_hash TEXT NOT NULL UNIQUE",
  "purpose TEXT NOT NULL CHECK (purpose = 'email_verification')",
  "consumption_id TEXT UNIQUE",
  "FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE",
  "idx_email_verification_tokens_active"
]) assert.ok(migration.includes(requirement), "Missing email verification schema requirement: " + requirement);
assert.ok(!/UPDATE\s+users\s+SET\s+verified\s*=/i.test(migration), "Do not repurpose the existing verification badge");

const python = [
"import sqlite3",
"db=sqlite3.connect(':memory:')",
"db.execute('PRAGMA foreign_keys=ON')",
"db.execute('CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT NOT NULL UNIQUE,verified INTEGER NOT NULL DEFAULT 0)')",
"db.execute('INSERT INTO users(id,email,verified) VALUES(1,?,1)',('creator@example.test',))",
"db.executescript(" + JSON.stringify(migration) + ")",
"cols={r[1] for r in db.execute('PRAGMA table_info(users)')}",
"assert 'email_verified_at' in cols",
"assert db.execute('SELECT verified,email_verified_at FROM users WHERE id=1').fetchone()==(1,None)",
"db.execute('INSERT INTO email_verification_tokens(user_id,email_snapshot,token_hash,purpose,expires_at) VALUES(1,?,?,?,?)',('creator@example.test','A'*43,'email_verification','2026-11-03T00:00:00.000Z'))",
"assert db.execute('SELECT email_snapshot,purpose FROM email_verification_tokens').fetchone()==('creator@example.test','email_verification')",
"try:",
" db.execute('INSERT INTO email_verification_tokens(user_id,email_snapshot,token_hash,purpose,expires_at) VALUES(1,?,?,?,?)',('creator@example.test','B'*43,'password_reset','2026-11-03T00:00:00.000Z'))",
" raise AssertionError('wrong token purpose accepted')",
"except sqlite3.IntegrityError:",
" db.rollback()",
"assert db.execute('SELECT verified,email_verified_at FROM users WHERE id=1').fetchone()==(1,None)",
"print('PASS: email ownership verification is independent from creator/admin badge verification.')"
].join("\n");
const result=spawnSync("python3",["-c",python],{encoding:"utf8"});
if(result.error) throw result.error;
if(result.status!==0){process.stderr.write(result.stderr||"");process.stdout.write(result.stdout||"");process.exit(result.status||1);}
process.stdout.write(result.stdout);
