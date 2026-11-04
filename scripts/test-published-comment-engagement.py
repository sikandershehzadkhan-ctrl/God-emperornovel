import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("""
CREATE TABLE novels(id INTEGER PRIMARY KEY, publication_status TEXT NOT NULL, rights_status TEXT NOT NULL);
CREATE TABLE comments(id INTEGER PRIMARY KEY, novel_id INTEGER NOT NULL, status TEXT NOT NULL);
INSERT INTO novels VALUES
 (1,'published','original'),
 (2,'draft','original'),
 (3,'published','pending'),
 (4,'published','licensed'),
 (5,'archived','authorized');
INSERT INTO comments VALUES
 (11,1,'visible'),
 (12,2,'visible'),
 (13,3,'visible'),
 (14,4,'visible'),
 (15,1,'hidden'),
 (16,5,'visible');
""")
comment_target = """
SELECT c.id FROM comments c JOIN novels n ON n.id=c.novel_id
WHERE c.id=? AND c.status='visible' AND n.publication_status='published'
AND n.rights_status IN ('original','public_domain','licensed','authorized')
"""
for cid, expected in [(11,11),(12,None),(13,None),(14,14),(15,None),(16,None),(999,None)]:
    row = db.execute(comment_target, (cid,)).fetchone()
    assert (row[0] if row else None) == expected, (cid, row, expected)
follow_target = """
SELECT 1 FROM novels WHERE id=? AND publication_status='published'
AND rights_status IN ('original','public_domain','licensed','authorized')
"""
for nid, expected in [(1,True),(2,False),(3,False),(4,True),(5,False),(999,False)]:
    assert bool(db.execute(follow_target, (nid,)).fetchone()) is expected
print("PASS: only visible comments on published, rights-eligible novels and published follow targets pass.")
