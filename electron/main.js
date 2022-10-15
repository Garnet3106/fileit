const { BrowserWindow, app } = require('electron');
const electronReload = require('electron-reload');
const isDev = require('electron-is-dev');

const path = require('path');

const createWindow = () => {
    if (isDev) {
        electronReload(path.resolve(__dirname, '../build'), {
            electron: path.join(__dirname, '../node_modules/.bin/electron'),
        });
    }

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
    mainWindow.loadFile(path.resolve(__dirname, '../build/index.html'));
};

app.whenReady().then(createWindow);
app.once('window-all-closed', () => app.quit());
