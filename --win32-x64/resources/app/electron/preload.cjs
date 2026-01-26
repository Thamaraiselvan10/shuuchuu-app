const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    dbQuery: (sql, params) => ipcRenderer.invoke('db-query', sql, params),
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    onAlarmTriggered: (callback) => ipcRenderer.on('alarm-triggered', (event, alarm) => callback(alarm)),
});
