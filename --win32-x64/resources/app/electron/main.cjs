const electron = require('electron');
console.log('Electron module keys:', Object.keys(electron));
console.log('Process versions:', process.versions);
const { app, BrowserWindow, ipcMain, dialog } = electron;
const path = require('path');
const dbManager = require('./database.cjs');
const alarmService = require('./alarmService.cjs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// if (require('electron-squirrel-startup')) {
//     app.quit();
// }

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    const isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(async () => {
    await dbManager.init();
    alarmService.start();
    createWindow();

    // Listen for alarms from the service
    alarmService.on('alarm-triggered', (alarm) => {
        if (mainWindow) {
            mainWindow.webContents.send('alarm-triggered', alarm);
        }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC Handlers
ipcMain.handle('db-query', (event, sql, params) => {
    return dbManager.query(sql, params);
});

ipcMain.handle('db-backup', async () => {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Backup Database',
        defaultPath: 'productivity-backup.json',
        filters: [{ name: 'JSON', extensions: ['json'] }]
    });

    if (filePath) {
        return dbManager.exportToJson(filePath);
    }
    return null;
});

ipcMain.handle('db-restore', async () => {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: 'Restore Database',
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: ['openFile']
    });

    if (filePaths && filePaths.length > 0) {
        return dbManager.importFromJson(filePaths[0]);
    }
    return null;
});

// Alarm IPC
ipcMain.handle('alarm-create', (event, alarm) => alarmService.createAlarm(alarm));
ipcMain.handle('alarm-get', () => alarmService.getAlarms());
ipcMain.handle('alarm-delete', (event, id) => alarmService.deleteAlarm(id));
ipcMain.handle('alarm-toggle', (event, { id, enabled }) => alarmService.toggleAlarm(id, enabled));

// Notification IPC
ipcMain.handle('show-notification', (event, { title, body }) => {
    new Notification({ title, body }).show();
});
