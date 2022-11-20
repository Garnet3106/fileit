const { BrowserWindow, app, ipcMain, shell } = require('electron');
const electronReload = require('electron-reload');
const isDev = require('electron-is-dev');
const path = require('path');
let mainWindow = null;

const createWindow = () => {
    if (isDev) {
        electronReload(path.resolve(__dirname, '../build'), {
            electron: path.join(__dirname, '../node_modules/.bin/electron'),
        });
    }

    mainWindow = new BrowserWindow({
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

ipcMain.on('close-window', () => mainWindow?.close());

ipcMain.on('minimize-window', () => mainWindow?.minimize());

ipcMain.on('run-file', (_event, path) => shell.openPath(path).catch(console.error));

app.once('window-all-closed', () => app.quit());

app.whenReady().then(createWindow);
