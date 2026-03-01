import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure the db directory exists
const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize the database
const dbPath = path.join(dbDir, 'ruley.db');
const db = new Database(dbPath, { 
  verbose: process.env.NODE_ENV === 'development' ? console.log : undefined 
});

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Initialize tables
export const initDb = () => {
  // Main configs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      urls TEXT NOT NULL,
      platform TEXT NOT NULL DEFAULT 'clash',
      advanced_dns BOOLEAN DEFAULT 0,
      proxy_groups TEXT NOT NULL DEFAULT '[]',
      rules TEXT NOT NULL DEFAULT '[]',
      node_count INTEGER DEFAULT 0,
      parsed_nodes TEXT,
      generated_config TEXT,
      parent_id INTEGER REFERENCES configs(id) ON DELETE CASCADE,
      cloud_token TEXT UNIQUE,
      cloud_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Add columns if missing (for existing databases)
  try {
    db.exec(`ALTER TABLE configs ADD COLUMN parsed_nodes TEXT`);
  } catch {}
  try {
    db.exec(`ALTER TABLE configs ADD COLUMN generated_config TEXT`);
  } catch {}
  try {
    db.exec(`ALTER TABLE configs ADD COLUMN parent_id INTEGER REFERENCES configs(id) ON DELETE CASCADE`);
  } catch {}

  // Migrate from old cloud_configs table if it exists
  try {
    const oldTableExists = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='cloud_configs'"
    ).get();

    if (oldTableExists) {
      const oldRows = db.prepare('SELECT * FROM cloud_configs').all() as any[];
      const insert = db.prepare(`
        INSERT OR IGNORE INTO configs (name, urls, platform, advanced_dns, proxy_groups, rules, cloud_token, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const row of oldRows) {
        insert.run(
          `迁移配置 - ${row.token.slice(0, 8)}`,
          row.urls,
          row.platform,
          row.advanced_dns,
          row.proxy_groups,
          row.rules,
          row.token,
          row.created_at,
          row.updated_at
        );
      }

      // Drop old tables
      db.exec('DROP TABLE IF EXISTS cloud_configs');
      db.exec('DROP TABLE IF EXISTS settings');
      db.exec('DROP TABLE IF EXISTS subscriptions');
      db.exec('DROP TABLE IF EXISTS rules');
      console.log(`[DB] Migrated ${oldRows.length} records from cloud_configs → configs`);
    }
  } catch (err) {
    console.warn('[DB] Migration check skipped:', err);
  }

  // Cleanup: remove configs older than 30 days without cloud_token
  try {
    const result = db.prepare(
      "DELETE FROM configs WHERE cloud_token IS NULL AND updated_at < datetime('now', '-30 days')"
    ).run();
    if (result.changes > 0) {
      console.log(`[DB] Cleaned up ${result.changes} expired configs`);
    }
  } catch {}
};

export default db;
