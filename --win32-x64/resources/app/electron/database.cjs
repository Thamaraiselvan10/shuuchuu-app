const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const initSqlJs = require('sql.js');

class DatabaseManager {
    constructor() {
        this.db = null;
        this.dbPath = null;
    }

    async init() {
        this.dbPath = path.join(app.getPath('userData'), 'productivity.db');

        try {
            const SQL = await initSqlJs();

            if (fs.existsSync(this.dbPath)) {
                const filebuffer = fs.readFileSync(this.dbPath);
                this.db = new SQL.Database(filebuffer);
                console.log('Database loaded from:', this.dbPath);
            } else {
                this.db = new SQL.Database();
                console.log('New database created at:', this.dbPath);
                this.createTables();
                this.save();
            }
            return Promise.resolve();
        } catch (err) {
            console.error('Could not initialize database', err);
            return Promise.reject(err);
        }
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
        `);
    }

    query(sql, params = []) {
        return new Promise((resolve, reject) => {
            try {
                // sql.js expects params as an array or object.
                // It doesn't support named params like :id if passed as array? 
                // Actually it does support binding.

                if (sql.trim().toLowerCase().startsWith('select')) {
                    // Use exec for SELECT to get columns and values
                    // But exec doesn't support binding params easily in one go?
                    // Wait, db.exec returns [{columns, values}] but takes sql string.
                    // To use params, we should use prepare statement.

                    const stmt = this.db.prepare(sql);
                    stmt.bind(params);

                    const rows = [];
                    while (stmt.step()) {
                        rows.push(stmt.getAsObject());
                    }
                    stmt.free();
                    resolve(rows);
                } else {
                    // For INSERT/UPDATE/DELETE
                    this.db.run(sql, params);

                    // Get last ID if needed (for insert)
                    // const res = this.db.exec("SELECT last_insert_rowid()");
                    // const lastID = res[0].values[0][0];

                    this.save(); // Persist changes immediately
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
            const tables = ['tasks', 'subtasks', 'pomodoro_sessions', 'alarms', 'diary_entries'];
            const data = {};

            for (const table of tables) {
                data[table] = await this.query(`SELECT * FROM ${table}`);
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
                const sql = `INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`;

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
