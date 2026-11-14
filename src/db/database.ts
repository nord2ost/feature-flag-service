import Database from 'better-sqlite3';

const db = new Database('flags.db');

// Enable Write-Ahead Logging for better performance and reliability
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS flags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 0,
    payload TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT NOT NULL
  )
`);

export interface FlagRow {
    id: number;
    key: string;
    description: string;
    enabled: number; // SQLite stores booleans as 0 or 1
    payload: string; // Stored as a JSON string
    updated_at: string;
}

const countStmt = db.prepare('SELECT COUNT(*) as count FROM flags');
const { count } = countStmt.get() as { count: number };

if (count === 0) {
    const insertStmt = db.prepare(`
    INSERT INTO flags (key, description, enabled, payload, updated_at)
    VALUES (@key, @description, @enabled, @payload, @updated_at)
  `);

    const now = new Date().toISOString();

    const initialFlags = [
        {
            key: 'maintenance_mode',
            description: 'Block app access with a full-screen maintenance notice',
            enabled: 0,
            payload: JSON.stringify({ message: 'We are upgrading our servers. Back in 10 mins!' }),
            updated_at: now,
        },
        {
            key: 'new_checkout_flow',
            description: 'Enable one-tap Apple/Google Pay checkout banner',
            enabled: 1,
            payload: JSON.stringify({ discountBadge: '10% OFF' }),
            updated_at: now,
        },
        {
            key: 'dark_theme_default',
            description: 'Force dark mode across the mobile app UI',
            enabled: 0,
            payload: JSON.stringify({}),
            updated_at: now,
        },
        {
            key: 'min_app_version',
            description: 'Require users below this version to update',
            enabled: 1,
            payload: JSON.stringify({ version: '2.2.0' }),
            updated_at: now,
        },
    ];

    // Wrap inserts in a transaction so all 4 succeed together
    const seedMany = db.transaction((flags) => {
        for (const flag of flags) {
            insertStmt.run(flag);
        }
    });

    seedMany(initialFlags);
    console.log('Seeded 4 initial feature flags into flags.db');
}

export default db;
