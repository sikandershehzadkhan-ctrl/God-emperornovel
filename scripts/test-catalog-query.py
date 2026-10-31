import sqlite3
from pathlib import Path

db = sqlite3.connect(":memory:")
db.row_factory = sqlite3.Row
db.executescript("""
CREATE TABLE novels(id INTEGER PRIMARY KEY,title TEXT,author TEXT,description TEXT,alt_titles TEXT,status TEXT,kind TEXT,language TEXT,views INTEGER,rating REAL,created_at TEXT,updated_at TEXT,publication_status TEXT);
CREATE TABLE genres(id INTEGER PRIMARY KEY,name TEXT,slug TEXT);
CREATE TABLE tags(id INTEGER PRIMARY KEY,name TEXT,slug TEXT);
CREATE TABLE novel_genres(novel_id INTEGER,genre_id INTEGER,PRIMARY KEY(novel_id,genre_id));
CREATE TABLE novel_tags(novel_id INTEGER,tag_id INTEGER,PRIMARY KEY(novel_id,tag_id));
CREATE TABLE chapters(id INTEGER PRIMARY KEY,novel_id INTEGER,chapter_number INTEGER,publication_status TEXT);
CREATE TABLE unlocks(user_id INTEGER,chapter_id INTEGER,unlocked_at TEXT);
CREATE INDEX idx_chapters_publication ON chapters(novel_id,publication_status,chapter_number);
CREATE INDEX idx_unlocks_time ON unlocks(unlocked_at);
""")

# Apply the exact additive migration so the test checks the production D1 index definitions.
migration = Path(__file__).resolve().parents[1] / "migrations" / "0009_catalog_filter_indexes.sql"
db.executescript(migration.read_text(encoding="utf-8"))
for i in range(1, 7):
    db.execute("INSERT INTO genres VALUES(?,?,?)", (i, f"Genre {i}", f"genre-{i}"))
for i in range(1, 16):
    db.execute("INSERT INTO tags VALUES(?,?,?)", (i, f"Tag {i}", f"tag-{i}"))
for nid in range(1, 81):
    db.execute("INSERT INTO novels VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
        (nid, f"Fantasy Story {nid}", f"Author {nid % 9}", "A fantasy adventure",
         "alternate fantasy", "ongoing" if nid % 3 else "completed",
         "fanfiction" if nid % 4 == 0 else "original", "English" if nid % 2 else "Urdu",
         nid * 7, 1 + (nid % 5), "2026-01-01", f"2026-02-{(nid % 27) + 1:02d}",
         "published" if nid % 11 else "draft"))
    for gid in range(1, 5):
        db.execute("INSERT INTO novel_genres VALUES(?,?)", (nid, gid))
    for tid in range(1, 11):
        db.execute("INSERT INTO novel_tags VALUES(?,?)", (nid, tid))
    for ch in range(1, 41):
        cid = nid * 100 + ch
        db.execute("INSERT INTO chapters VALUES(?,?,?,?)",
                   (cid, nid, ch, "draft" if ch % 13 == 0 else "published"))
        if ch % 4 == 0:
            db.execute("INSERT INTO unlocks VALUES(1,?,datetime('now','-1 day'))", (cid,))
db.commit()

genre_plan = " ".join(row[3] for row in db.execute(
    """EXPLAIN QUERY PLAN
       SELECT n.id FROM novels n
       WHERE n.publication_status='published'
         AND n.id IN (
           SELECT ng.novel_id FROM novel_genres ng
           JOIN genres g ON g.id=ng.genre_id WHERE g.slug=?
         )""",
    ("genre-2",),
))
tag_plan = " ".join(row[3] for row in db.execute(
    """EXPLAIN QUERY PLAN
       SELECT n.id FROM novels n
       WHERE n.publication_status='published'
         AND n.id IN (
           SELECT nt.novel_id FROM novel_tags nt
           JOIN tags t ON t.id=nt.tag_id WHERE t.slug=?
         )""",
    ("tag-3",),
))
assert "idx_novel_genres_genre_novel" in genre_plan, genre_plan
assert "idx_novel_tags_tag_novel" in tag_plan, tag_plan

trending_plan = " ".join(row[3] for row in db.execute(
    """EXPLAIN QUERY PLAN
       SELECT COUNT(*) FROM unlocks ux
       JOIN chapters cx ON cx.id=ux.chapter_id
       WHERE cx.novel_id=? AND ux.unlocked_at>=datetime('now','-7 days')""",
    (1,),
))
assert "idx_unlocks_chapter_time" in trending_plan, trending_plan

OLD = """SELECT n.*,GROUP_CONCAT(DISTINCT g.name) genres,GROUP_CONCAT(DISTINCT t.name) tags,
COUNT(DISTINCT c.id) chapter_count,MAX(c.chapter_number) latest_chapter
FROM novels n
LEFT JOIN novel_genres ng ON ng.novel_id=n.id
LEFT JOIN genres g ON g.id=ng.genre_id
LEFT JOIN novel_tags nt ON nt.novel_id=n.id
LEFT JOIN tags t ON t.id=nt.tag_id
LEFT JOIN chapters c ON c.novel_id=n.id AND c.publication_status='published'
WHERE n.publication_status='published'"""
NEW = """SELECT n.*,
(SELECT GROUP_CONCAT(DISTINCT g.name) FROM novel_genres ng JOIN genres g ON g.id=ng.genre_id WHERE ng.novel_id=n.id) genres,
(SELECT GROUP_CONCAT(DISTINCT t.name) FROM novel_tags nt JOIN tags t ON t.id=nt.tag_id WHERE nt.novel_id=n.id) tags,
(SELECT COUNT(*) FROM chapters c WHERE c.novel_id=n.id AND c.publication_status='published') chapter_count,
(SELECT MAX(c.chapter_number) FROM chapters c WHERE c.novel_id=n.id AND c.publication_status='published') latest_chapter
FROM novels n WHERE n.publication_status='published'"""

def run(base, filters, sort, page=1, limit=17):
    sql, args = base, []
    term = filters.get("q", "").strip().lower()
    if term:
        sql += " AND (LOWER(n.title) LIKE ? OR LOWER(n.author) LIKE ? OR LOWER(n.description) LIKE ? OR LOWER(n.alt_titles) LIKE ?)"
        args.extend(["%" + term + "%"] * 4)
    if filters.get("genre"):
        sql += " AND n.id IN(SELECT ng.novel_id FROM novel_genres ng JOIN genres g ON g.id=ng.genre_id WHERE g.slug=?)"
        args.append(filters["genre"])
    if filters.get("tag"):
        sql += " AND n.id IN(SELECT nt.novel_id FROM novel_tags nt JOIN tags t ON t.id=nt.tag_id WHERE t.slug=?)"
        args.append(filters["tag"])
    if filters.get("status") in ("ongoing", "completed"):
        sql += " AND n.status=?"; args.append(filters["status"])
    if filters.get("kind"):
        sql += " AND n.kind=?"; args.append(filters["kind"])
    if filters.get("language"):
        sql += " AND LOWER(n.language)=LOWER(?)"; args.append(filters["language"])
    if filters.get("author"):
        sql += " AND LOWER(n.author)=LOWER(?)"; args.append(filters["author"])
    if filters.get("min_rating", 0) > 0:
        sql += " AND n.rating>=?"; args.append(min(5, filters["min_rating"]))
    if base == OLD:
        sql += " GROUP BY n.id"
    order = {
        "views": "n.views DESC",
        "rating": "n.rating DESC",
        "chapters": "chapter_count DESC",
        "newest": "n.created_at DESC",
        "trending": "(SELECT COUNT(*) FROM unlocks ux JOIN chapters cx ON cx.id=ux.chapter_id WHERE cx.novel_id=n.id AND ux.unlocked_at>=datetime('now','-7 days')) DESC",
    }.get(sort, "n.updated_at DESC")
    sql += " ORDER BY " + order + ",n.id DESC LIMIT ? OFFSET ?"
    args.extend([limit, (page - 1) * limit])
    return [dict(row) for row in db.execute(sql, args).fetchall()]

cases = [
    ({}, "updated"), ({}, "chapters"), ({}, "trending"), ({}, "views"),
    ({"q": "fantasy"}, "rating"),
    ({"genre": "genre-2", "tag": "tag-3"}, "updated"),
    ({"status": "completed", "kind": "fanfiction"}, "newest"),
    ({"language": "urdu", "min_rating": 3}, "rating"),
    ({"author": "author 4"}, "updated"),
]
for filters, sort in cases:
    old_rows = run(OLD, filters, sort)
    new_rows = run(NEW, filters, sort)
    assert old_rows == new_rows, (filters, sort, old_rows[:1], new_rows[:1])
    assert all(row["chapter_count"] == 37 for row in new_rows)
print(f"PASS: {len(cases)} catalog query parity cases; relationship row multiplication removed.")
