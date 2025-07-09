const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    send: (channel, data) => {
        ipcRenderer.send(channel, data);
    },
    receive: (channel, func) => {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
});

contextBridge.exposeInMainWorld('widgetAPI', {
  setWidgetState: (state) => ipcRenderer.send('widget-state', state)
});
