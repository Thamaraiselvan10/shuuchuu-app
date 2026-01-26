const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class DatabaseManager {
    constructor() {
        this.db = null;
        this.dbPath = null;
        this.initPromise = null;
    }

    async init() {
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            this.dbPath = path.join(app.getPath('userData'), 'productivity.db');

            // Lazy load sql.js
            const initSqlJs = require('sql.js');

            try {
                const SQL = await initSqlJs();

                if (fs.existsSync(this.dbPath)) {
                    const filebuffer = fs.readFileSync(this.dbPath);
                    this.db = new SQL.Database(filebuffer);
                    console.log('Database loaded from:', this.dbPath);
                    this.createTables(); // Ensure new tables are created
                    this.save();
                } else {
                    this.db = new SQL.Database();
                    console.log('New database created at:', this.dbPath);
                    this.createTables();
                    this.save();
                }
                return true;
            } catch (err) {
                console.error('Could not initialize database', err);
                throw err;
            }
        })();

        return this.initPromise;
    }

    save() {
        if (!this.db) return;
        const data = this.db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(this.dbPath, buffer);
    }

    createTables() {
        this.db.run(`
            CREATE TABLE IF NOT EXISTS tasks (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              description TEXT,
              category TEXT,
              priority INTEGER DEFAULT 0,
              is_today_focus INTEGER DEFAULT 0,
              status TEXT DEFAULT 'pending',
              due_at TEXT,
              estimated_minutes INTEGER,
              is_recurring INTEGER DEFAULT 0,
              recurrence_rule TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT
            );

            CREATE TABLE IF NOT EXISTS subtasks (
              id TEXT PRIMARY KEY,
              task_id TEXT NOT NULL,
              title TEXT NOT NULL,
              is_done INTEGER DEFAULT 0,
              FOREIGN KEY (task_id) REFERENCES tasks(id)
            );

            CREATE TABLE IF NOT EXISTS pomodoro_sessions (
              id TEXT PRIMARY KEY,
              task_id TEXT,
              start_at TEXT,
              end_at TEXT,
              duration_minutes INTEGER,
              interrupted INTEGER DEFAULT 0,
              type TEXT DEFAULT 'focus'
            );

            CREATE TABLE IF NOT EXISTS alarms (
              id TEXT PRIMARY KEY,
              label TEXT,
              time TEXT,
              recurrence TEXT,
              enabled INTEGER DEFAULT 1,
              created_at TEXT
            );

            CREATE TABLE IF NOT EXISTS diary_entries (
              id TEXT PRIMARY KEY,
              title TEXT,
              content TEXT,
              mood TEXT,
              attachments TEXT,
              created_at TEXT,
              updated_at TEXT
            );

            CREATE TABLE IF NOT EXISTS goals (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                category TEXT,
                priority INTEGER DEFAULT 0,
                deadline TEXT,
                status TEXT DEFAULT 'active',
                created_at TEXT,
                updated_at TEXT
            );

            CREATE TABLE IF NOT EXISTS goal_phases (
                id TEXT PRIMARY KEY,
                goal_id TEXT,
                title TEXT NOT NULL,
                description TEXT,
                start_date TEXT,
                deadline TEXT,
                status TEXT DEFAULT 'pending',
                order_index INTEGER,
                is_completed INTEGER DEFAULT 0,
                completion_comment TEXT,
                created_at TEXT,
                updated_at TEXT,
                FOREIGN KEY(goal_id) REFERENCES goals(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS habits (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                category TEXT,
                created_at TEXT
            );

            CREATE TABLE IF NOT EXISTS habit_logs (
                id TEXT PRIMARY KEY,
                habit_id TEXT,
                completed_at TEXT,
                FOREIGN KEY(habit_id) REFERENCES habits(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                title TEXT,
                content TEXT,
                created_at TEXT,
                updated_at TEXT
            );
        `);

        this.migrate();
        this.save();
    }

    migrate() {
        // Add missing columns to goal_phases if they don't exist
        const columns = [
            { name: 'description', type: 'TEXT' },
            { name: 'start_date', type: 'TEXT' },
            { name: 'status', type: 'TEXT DEFAULT "pending"' },
            { name: 'completion_comment', type: 'TEXT' },
            { name: 'created_at', type: 'TEXT' },
            { name: 'updated_at', type: 'TEXT' }
        ];

        columns.forEach(col => {
            try {
                this.db.run(`ALTER TABLE goal_phases ADD COLUMN ${col.name} ${col.type}`);
                console.log(`Migrated: Added ${col.name} to goal_phases`);
            } catch (e) {
                // Column likely exists, ignore
            }
        });

        // Add is_today_focus to tasks
        try {
            this.db.run('ALTER TABLE tasks ADD COLUMN is_today_focus INTEGER DEFAULT 0');
            console.log('Migrated: Added is_today_focus to tasks');
        } catch (e) {
            // Column exists
        }

        // Add missing columns to diary_entries if they don't exist
        try {
            this.db.run(`ALTER TABLE diary_entries ADD COLUMN attachments TEXT`);
            console.log(`Migrated: Added attachments to diary_entries`);
        } catch (e) {
            // Column likely exists, ignore
        }

        // Add max_streak to habits
        try {
            this.db.run('ALTER TABLE habits ADD COLUMN max_streak INTEGER DEFAULT 0');
            console.log('Migrated: Added max_streak to habits');
        } catch (e) {
            // Column exists
        }
    }

    query(sql, params = []) {
        return new Promise(async (resolve, reject) => {
            try {
                if (!this.db) {
                    if (this.initPromise) {
                        await this.initPromise;
                    } else {
                        // If query is called before init, verify if we should auto-init or fail.
                        // Ideally init() is called by main, but let's be safe.
                        throw new Error('Database not initialized');
                    }
                }

                if (sql.trim().toLowerCase().startsWith('select')) {
                    const stmt = this.db.prepare(sql);
                    stmt.bind(params);
                    const rows = [];
                    while (stmt.step()) {
                        rows.push(stmt.getAsObject());
                    }
                    stmt.free();
                    resolve(rows);
                } else {
                    this.db.run(sql, params);
                    this.save();
                    resolve({ success: true });
                }
            } catch (err) {
                console.error('Query error:', err);
                reject(err);
            }
        });
    }

    async exportToJson(filePath) {
        try {
            const tables = ['tasks', 'settings', 'pomodoro_sessions', 'goals', 'goal_phases', 'habits', 'habit_logs', 'notes', 'diary_entries', 'alarms'];
            const data = {};

            for (const table of tables) {
                try {
                    const rows = await this.query(`SELECT * FROM ${table}`);
                    data[table] = rows;
                } catch (e) {
                    console.warn(`Could not export table ${table}:`, e);
                }
            }

            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return { success: true };
        } catch (err) {
            console.error('Export failed:', err);
            throw err;
        }
    }

    async importFromJson(filePath) {
        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const tables = Object.keys(data);

            for (const table of tables) {
                const rows = data[table];
                if (!rows || rows.length === 0) continue;

                this.db.run(`DELETE FROM ${table}`);

                const columns = Object.keys(rows[0]);
                const placeholders = columns.map(() => '?').join(',');
                const sql = `INSERT INTO ${table}(${columns.join(',')}) VALUES(${placeholders})`;

                rows.forEach(row => {
                    this.db.run(sql, Object.values(row));
                });
            }

            this.save();
            return { success: true };
        } catch (err) {
            console.error('Import failed:', err);
            throw err;
        }
    }
}

module.exports = new DatabaseManager();
