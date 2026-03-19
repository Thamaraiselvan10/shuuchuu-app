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

    invoke: (channel, data) => ipcRenderer.invoke(channel, data)
});
