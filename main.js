const { app, BrowserWindow, ipcMain, dialog, Notification, shell, screen, session } = require('electron');
const path = require('path');

// GLOBAL UA FIX: Force the app to identify as standard Chrome on Windows
app.userAgentFallback = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Fix for Windows Notifications to show correct App Name
if (process.platform === 'win32') {
    app.setAppUserModelId("com.focusbro.app");
}

// DEEP LINK PROTOCOL REGISTRATION
if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('focusbro', process.execPath, [path.resolve(process.argv[1])]);
    }
} else {
    app.setAsDefaultProtocolClient('focusbro');
}

// SINGLE INSTANCE LOCK
// This prevents multiple windows. If a second instance is launched (e.g. by deep link),
// it signals the first instance and quits.
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();

            // Handle Deep Link on Windows
            // The commandLine array contains the URL.
            // Example: [path/to/electron.exe, ., focusbro://auth/callback?token=...]
            const deepLinkUrl = commandLine.find(arg => arg.startsWith('focusbro://'));
            if (deepLinkUrl) {
                console.log("Main Process: Received Deep Link from Second Instance:", deepLinkUrl);
                handleDeepLink(deepLinkUrl);
            }
        }
    });
}

let dbManager;
let alarmService;

// Mini Mode State
let isMiniMode = false;
let previousBounds = { width: 1200, height: 800, x: undefined, y: undefined };

let mainWindow;

function toggleMiniMode(shouldEnter) {
    console.log('toggleMiniMode called with:', shouldEnter);
    if (!mainWindow) return;

    if (shouldEnter) {
        if (!isMiniMode) {
            // Save state if normal
            if (!mainWindow.isMinimized()) {
                previousBounds = mainWindow.getBounds();
            }

            isMiniMode = true;

            // Ensure window is ready for resizing
            if (mainWindow.isFullScreen()) mainWindow.setFullScreen(false);
            if (mainWindow.isMaximized()) mainWindow.unmaximize();
            if (mainWindow.isMinimized()) mainWindow.restore();

            // Apply Mini Mode settings - Resizable
            mainWindow.setMinimumSize(200, 250);
            mainWindow.setMaximumSize(400, 450); // Allow resize up to this
            mainWindow.setSize(250, 300);
            mainWindow.setResizable(true); // Enable manual resizing
            mainWindow.setAlwaysOnTop(true, 'floating');
            mainWindow.setMaximizable(false);
            mainWindow.setFullScreenable(false);

            mainWindow.webContents.send('mini-mode-change', true);
        } else {
            // AGGRESSIVE RESTORE: Unconditionally reset everything.
            // We don't care about 'isMiniMode' flag state anymore. If the user asks to restore, we restore.

            isMiniMode = false;

            // Unlock window constraints
            mainWindow.setMinimumSize(800, 600);
        }
    } else {
        // AGGRESSIVE RESTORE: Unconditionally reset everything.
        // We don't care about 'isMiniMode' flag state anymore. If the user asks to restore, we restore.

        isMiniMode = false;

        // Unlock window constraints
        mainWindow.setMinimumSize(800, 600);
        mainWindow.setMaximumSize(9999, 9999);
        mainWindow.setResizable(true);
        mainWindow.setMaximizable(true);
        mainWindow.setFullScreenable(true);
        mainWindow.setAlwaysOnTop(false);

        // SERIALIZED RESTORE SEQUENCE
        // Step 1: Immediate Unlock of basic flags
        console.log('Step 1: Unlocking basic flags');
        mainWindow.setAlwaysOnTop(false);
        mainWindow.setMinimumSize(800, 600);
        mainWindow.setMaximumSize(9999, 9999); // Uncap size
        mainWindow.setResizable(true);
        mainWindow.setFullScreenable(true);
        mainWindow.setMaximizable(true);

        // Step 2: Wait for OS to apply flags, then Force Resize
        setTimeout(() => {
            if (!mainWindow) return;
            console.log('Step 2: Forcing Bounds to Work Area');

            const primaryDisplay = screen.getPrimaryDisplay();
            const { width, height, x, y } = primaryDisplay.workArea;

            // Explicitly set bounds to match desktop
            mainWindow.setBounds({ x, y, width, height });

            // Step 3: Maximize (Double tap)
            // Just in case setBounds didn't trigger the "maximized" state flag locally
            setTimeout(() => {
                if (!mainWindow) return;
                console.log('Step 3: Maximize Command');
                if (mainWindow.isMinimized()) mainWindow.restore();
                mainWindow.maximize();

                mainWindow.webContents.send('mini-mode-change', false);
            }, 100);

        }, 200);
    }
}

function createWindow() {
    const { width: screenWidth, height: screenHeight } = require('electron').screen.getPrimaryDisplay().workArea;

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        x: Math.floor((screenWidth - 1200) / 2),
        y: Math.floor((screenHeight - 800) / 2),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webviewTag: true // Enable <webview> tag for Email page
        },
    });
    mainWindow.setMenu(null);

    // Reset to default size first, then maximize
    mainWindow.setBounds({
        x: Math.floor((screenWidth - 1200) / 2),
        y: Math.floor((screenHeight - 800) / 2),
        width: 1200,
        height: 800
    });
    mainWindow.maximize();

    // RELIABLE DEV DETECTION:
    // If the app is NOT packaged (i.e. running from source via electron binary), treat as dev.
    // This allows loading from localhost:5173
    const isDev = !app.isPackaged;

    if (isDev) {
        // Attempt to load from dev server
        console.log("Running in Development Mode: Waiting for localhost:5173...");
        const loadDevServer = async () => {
            try {
                // Poll dev server
                const { net } = require('electron');
                const request = net.request('http://localhost:5173');
                request.on('response', (response) => {
                    console.log("Dev Server Ready. Loading URL...");
                    mainWindow.loadURL('http://localhost:5173');
                    // mainWindow.webContents.openDevTools(); // Commented out to prevent auto-opening
                });
                request.on('error', (error) => {
                    console.log("Dev Server not ready yet. Retrying in 1s...");
                    setTimeout(loadDevServer, 1000);
                });
                request.end();
            } catch (err) {
                setTimeout(loadDevServer, 1000);
            }
        };
        loadDevServer();
    } else {
        console.log("Running in Production Mode: Loading from file system");
        mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
    }

    // Open external links in the default browser
    // Open external links in the default browser, EXCEPT for Google Auth popups
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        console.log("Popup requested for:", url); // Debugging line

        // Firebase Auth often starts with about:blank
        if (url === 'about:blank') {
            return { action: 'allow' };
        }

        // Check if the URL is related to Google Auth or Firebase Auth
        if (url.startsWith('https://accounts.google.com') ||
            url.includes('firebaseapp.com') ||
            url.includes('auth')) {
            return { action: 'allow' };
        }

        if (url.startsWith('https:') || url.startsWith('http:')) {
            shell.openExternal(url);
        }
        return { action: 'deny' };
    });

    // Ensure the new window (popup) behaves correctly
    mainWindow.webContents.on('did-create-window', (window, details) => {
        window.setMenu(null); // Hide menu in popup
        // Optional: you can set other properties for the popup here
    });

    // Native Minimize Interception - REMOVED to allow normal minimization
    // mainWindow.on('minimize', (event) => {
    //     event.preventDefault();
    //     if (!isMiniMode) {
    //         toggleMiniMode(true);
    //     }
    // });
}

// IPC Handlers using the helper
ipcMain.handle('mini-mode-toggle', (event, shouldEnter) => {
    toggleMiniMode(shouldEnter);
});

ipcMain.handle('toggle-always-on-top', (event, shouldBeOnTop) => {
    if (mainWindow) {
        mainWindow.setAlwaysOnTop(shouldBeOnTop, 'floating');
    }
});

ipcMain.handle('get-mini-mode', () => {
    return isMiniMode;
});

console.time('Startup Duration');
app.whenReady().then(async () => {
    console.time('Create Window');
    createWindow();

    // UA SPOOFING FOR GOOGLE AUTH
    // This allows the "Sign in with Google" popup to work by hiding "Electron" from the User Agent
    const filter = {
        urls: ['https://accounts.google.com/*']
    };

    session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
        details.requestHeaders['User-Agent'] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

        // CRITICAL: Google checks these client hints too. Remove them or spoof them.
        delete details.requestHeaders['Sec-Ch-Ua'];
        delete details.requestHeaders['Sec-Ch-Ua-Mobile'];
        delete details.requestHeaders['Sec-Ch-Ua-Platform'];
        delete details.requestHeaders['Sec-Ch-Ua-Full-Version'];
        delete details.requestHeaders['Sec-Ch-Ua-Full-Version-List'];

        callback({ cancel: false, requestHeaders: details.requestHeaders });
    });

    console.timeEnd('Create Window');

    console.time('Require Modules');
    dbManager = require('./database.cjs');
    alarmService = require('./alarmService.cjs');
    console.timeEnd('Require Modules');

    console.time('DB Init');
    await dbManager.init();
    console.timeEnd('DB Init');

    console.time('Alarm Service Start');
    alarmService.start();
    console.timeEnd('Alarm Service Start');

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
ipcMain.handle('db-query', (event, sql, params) => {
    return dbManager.query(sql, params);
});

ipcMain.handle('db-backup', async () => {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Backup Database',
        defaultPath: 'focus-bro-backup.json',
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

ipcMain.handle('open-external', async (event, url) => {
    await shell.openExternal(url);
});

// Handle Deep Link on Mac
app.on('open-url', (event, url) => {
    event.preventDefault();
    console.log("Deep Link Received (Mac):", url);
    if (mainWindow) {
        handleDeepLink(url);
    }
});

function handleDeepLink(url) {
    try {
        console.log("Processing Deep Link:", url);
        const urlObj = new URL(url);
        // Protocol: focusbro://auth/callback?token=...
        if (urlObj.hostname === 'auth' && urlObj.pathname === '/callback') {
            const token = urlObj.searchParams.get('token');
            if (token && mainWindow) {
                console.log("Sending ID Token to Renderer");
                if (mainWindow.isMinimized()) mainWindow.restore();
                mainWindow.focus();

                // Allow some time for window/react to serve request
                setTimeout(() => {
                    mainWindow.webContents.send('deep-link-auth', token);
                }, 1000);
            }
        }
    } catch (error) {
        console.error("Deep Link Parsing Error:", error);
    }
}
