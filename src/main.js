const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

let mainWindow;
function createWindow() {
    const { width, height, x, y } = screen.getPrimaryDisplay().workArea;
    // Manually subtract 48px from height to avoid covering the taskbar
    mainWindow = new BrowserWindow({
        x,
        y,
        width,
        height: height - 48, // leave space for taskbar
        // minWidth: 340,
        // minHeight: 140,
        // maxWidth: 600,
        // maxHeight: 400,
        frame: false, // Remove title bar
        transparent: true, // Make window background transparent
        resizable: true, // Allow resizing for widget feel
        alwaysOnTop: true, // Optional: keep widget above other windows
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        }
    });

    mainWindow.loadFile('src/index.html');
    // mainWindow.webContents.openDevTools(); // Remove dev tools on startup

    // Start in minimized (click-through) mode, but allow mousemove events
    mainWindow.setIgnoreMouseEvents(true, { forward: true });

    // Listen for bring-to-front event from renderer
    ipcMain.on('bring-to-front', () => {
        if (mainWindow) {
            mainWindow.setAlwaysOnTop(true, 'screen-saver'); // ensure always on top
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

// Listen for widget state changes from renderer
ipcMain.on('widget-state', (event, state) => {
    if (!mainWindow) return;
    if (state === 'hover') {
        mainWindow.setIgnoreMouseEvents(false);
    } else {
        mainWindow.setIgnoreMouseEvents(true, { forward: true });
    }
});

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
