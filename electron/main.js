const { BrowserWindow, app } = require('electron');
const path = require('path');

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        height: 600,
        width: 800,
        minHeight: 250,
        minWidth: 400,
        titleBarStyle: 'hidden',
        webPreferences: {
            preload: path.resolve(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    mainWindow.setMenuBarVisibility(false);
    mainWindow.loadFile('build/index.html');
};

app.whenReady().then(createWindow);
app.once('window-all-closed', () => app.quit());
