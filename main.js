const { app, BrowserWindow, ipcMain, protocol, shell, Tray, Menu, nativeImage, Notification } = require('electron');
const path = require('path');
const alarmService = require('./alarmService.cjs');
const dbManager = require('./database.cjs');

// Fix for Windows Notifications to show correct App Name
if (process.platform === 'win32') {
    app.setAppUserModelId('com.focusbro.app');
}

let mainWindow;
let tray;
let isMiniMode = false;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: true, // Standard Windows frame
        transparent: false,
        backgroundColor: '#121212',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            devTools: true,
        },
        icon: path.join(__dirname, 'assets/icon.png')
    });

    if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Optimization: Don't show until ready to prevent flicker
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
}

function createTray() {
    const iconImage = nativeImage.createFromPath(path.join(__dirname, 'assets/icon.png'));
    const resizedIcon = iconImage.isEmpty() ? null : iconImage.resize({ width: 16, height: 16 });
    
    tray = new Tray(resizedIcon || nativeImage.createEmpty());
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show App', click: () => mainWindow?.show() },
        { label: 'Quit', click: () => app.quit() }
    ]);
    tray.setToolTip('Shuuchuu');
    tray.setContextMenu(contextMenu);
}

app.whenReady().then(async () => {
    console.time('Startup Duration');
    
    // 1. Initialize Database FIRST
    try {
        await dbManager.init();
        console.log('Database initialized successfully');
    } catch (err) {
        console.error('Failed to initialize database:', err);
    }

    createWindow();
    createTray();

    // Register custom protocol for local assets
    protocol.registerFileProtocol('app', (request, callback) => {
        const url = request.url.replace('app://', '');
        try {
            return callback(path.normalize(path.join(__dirname, url)));
        } catch (error) {
            console.error(error);
        }
    });

    // 2. Start Alarm Service AFTER DB IS READY
    alarmService.start();

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
    console.timeEnd('Startup Duration');
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC Handlers
ipcMain.on('close-app', () => app.quit());
ipcMain.on('minimize-app', () => mainWindow?.minimize());
ipcMain.on('maximize-app', () => {
    if (mainWindow?.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow?.maximize();
    }
});

ipcMain.handle('toggle-always-on-top', (event, shouldBeOnTop) => {
    mainWindow?.setAlwaysOnTop(shouldBeOnTop, 'screen-saver');
    return true;
});

// SQLite Query Handler
ipcMain.handle('db-query', async (event, sql, params) => {
    return await dbManager.query(sql, params);
});

// Mini Mode Handlers
ipcMain.handle('mini-mode-toggle', async (event, shouldEnter) => {
    isMiniMode = shouldEnter;
    
    if (shouldEnter) {
        mainWindow.setMinimumSize(320, 480);
        mainWindow.setSize(320, 480);
        mainWindow.setAlwaysOnTop(true, 'screen-saver');
    } else {
        mainWindow.setMinimumSize(1200, 800);
        mainWindow.setSize(1200, 800);
        mainWindow.setAlwaysOnTop(false);
        mainWindow.center();
    }
    
    // Notify renderer
    mainWindow.webContents.send('mini-mode-change', isMiniMode);
    return isMiniMode;
});

ipcMain.handle('get-mini-mode', () => isMiniMode);

ipcMain.handle('show-notification', (event, { title, body }) => {
    new Notification({ title, body }).show();
    return true;
});

app.on('web-contents-created', (event, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
});
