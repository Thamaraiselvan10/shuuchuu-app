import { v4 as uuidv4 } from 'uuid';

const db = window.electronAPI;

export const taskService = {
    getAll: async () => {
        return await db.dbQuery('SELECT * FROM tasks ORDER BY created_at DESC');
    },

    create: async (task) => {
        const newTask = {
            id: uuidv4(),
            title: task.title,
            description: task.description || '',
            category: task.category || 'General',
            priority: task.priority || 0,
            status: 'pending',
            due_at: task.due_at || null,
            estimated_minutes: task.estimated_minutes || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const sql = `
      INSERT INTO tasks (id, title, description, category, priority, status, due_at, estimated_minutes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        await db.dbQuery(sql, [
            newTask.id, newTask.title, newTask.description, newTask.category, newTask.priority,
            newTask.status, newTask.due_at, newTask.estimated_minutes, newTask.created_at, newTask.updated_at
        ]);

        return newTask;
    },

    update: async (id, updates) => {
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updates), new Date().toISOString(), id];

        const sql = `UPDATE tasks SET ${fields}, updated_at = ? WHERE id = ?`;
        await db.dbQuery(sql, values);
        return { id, ...updates };
    },

    delete: async (id) => {
        await db.dbQuery('DELETE FROM tasks WHERE id = ?', [id]);
        return { success: true };
    },

    toggleStatus: async (id, currentStatus) => {
        const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
        await db.dbQuery('UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?', [newStatus, new Date().toISOString(), id]);
        return newStatus;
    }
};
