-- schema.sql — tickets table for the support agent demo
DROP TABLE IF EXISTS tickets;

CREATE TABLE tickets (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  subject     TEXT    NOT NULL,
  description TEXT,
  priority    TEXT    NOT NULL DEFAULT 'P3',   -- P1..P4 (internal)
  team        TEXT    NOT NULL DEFAULT 'Support', -- routing target (internal)
  customer    TEXT,                              -- caller / org
  summary     TEXT,                              -- internal AI summary (screen-pop)
  status      TEXT    NOT NULL DEFAULT 'Open',   -- customer-facing
  created_at  INTEGER NOT NULL                   -- unix ms
);

-- Optional: make the first real ticket number look realistic (#4127),
-- matching the console mockup. Seeds the autoincrement counter, then removes the seed row.
INSERT INTO tickets (id, subject, priority, team, status, created_at) VALUES (4126, 'seed', 'P4', 'Support', 'Closed', 0);
DELETE FROM tickets WHERE id = 4126;
