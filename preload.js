console.log("PRELOAD SCRIPT LOADED");
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    dbQuery: (sql, params) => ipcRenderer.invoke('db-query', sql, params),
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    onAlarmTriggered: (callback) => ipcRenderer.on('alarm-triggered', (event, alarm) => callback(alarm)),

    // Mini Mode
    toggleMiniMode: (shouldEnter) => ipcRenderer.invoke('mini-mode-toggle', shouldEnter),
    onMiniModeChange: (callback) => ipcRenderer.on('mini-mode-change', (event, isMini) => callback(isMini)),
    getMiniMode: () => ipcRenderer.invoke('get-mini-mode'),
    minimizeApp: () => ipcRenderer.send('minimize-app'),
    toggleAlwaysOnTop: (shouldBeOnTop) => ipcRenderer.invoke('toggle-always-on-top', shouldBeOnTop),

    // Deep Link Auth
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    onDeepLinkAuth: (callback) => ipcRenderer.on('deep-link-auth', (event, token) => callback(token)),
    removeDeepLinkAuthListener: () => ipcRenderer.removeAllListeners('deep-link-auth')
});
