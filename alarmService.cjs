const { Notification } = require('electron');
const dbManager = require('./database.cjs');
const EventEmitter = require('events');

class AlarmService extends EventEmitter {
    constructor() {
        super();
        this.checkInterval = null;
    }

    start() {
        // Check alarms every minute
        this.checkInterval = setInterval(() => this.checkAlarms(), 60000);
        this.checkAlarms(); // Check immediately on start
    }

    stop() {
        if (this.checkInterval) clearInterval(this.checkInterval);
    }

    async checkAlarms() {
        try {
            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            // Get all enabled alarms
            const alarms = await dbManager.query('SELECT * FROM alarms WHERE enabled = 1');

            alarms.forEach(alarm => {
                // Simple daily alarm check for now.
                if (alarm.time === currentTime) {
                    this.triggerAlarm(alarm);
                }
            });
        } catch (err) {
            console.error('Error checking alarms:', err);
        }
    }

    triggerAlarm(alarm) {
        // Show system notification
        new Notification({
            title: 'Alarm',
            body: alarm.label || 'Alarm triggered!',
            silent: false // We will play sound in renderer too
        }).show();

        // Emit event for main process to handle (sending to renderer)
        this.emit('alarm-triggered', alarm);
    }

    async createAlarm(alarm) {
        const { id, label, time, recurrence, enabled } = alarm;
        const sql = `INSERT INTO alarms (id, label, time, recurrence, enabled, created_at) VALUES (?, ?, ?, ?, ?, ?)`;
        await dbManager.query(sql, [id, label, time, recurrence, enabled ? 1 : 0, new Date().toISOString()]);
        return { success: true };
    }

    async getAlarms() {
        return await dbManager.query('SELECT * FROM alarms ORDER BY time ASC');
    }

    async deleteAlarm(id) {
        await dbManager.query('DELETE FROM alarms WHERE id = ?', [id]);
        return { success: true };
    }

    async toggleAlarm(id, enabled) {
        await dbManager.query('UPDATE alarms SET enabled = ? WHERE id = ?', [enabled ? 1 : 0, id]);
        return { success: true };
    }
}

module.exports = new AlarmService();
