const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  receiveArray: (callback) => ipcRenderer.on('array-data', callback),
  requestArray: () => ipcRenderer.send('request-array'),
});