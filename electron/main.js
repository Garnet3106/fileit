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

ipcMain.on('get-platform', (event) => event.reply('get-platform', process.platform));

ipcMain.on('get-home-path', (event) => event.reply('get-home-path', process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME']));

ipcMain.on('close-window', () => mainWindow?.close());

ipcMain.on('minimize-window', () => mainWindow?.minimize());

ipcMain.on('run-file', (_event, targetPath) => shell.openPath(targetPath).catch(console.error));

// Use path.resolve() to convert received path separators for Windows.
// See more: https://github.com/electron/electron/issues/28831
ipcMain.on('trash-file', (_event, targetPath) => shell.trashItem(path.resolve(targetPath)).catch(console.error));

app.once('window-all-closed', () => app.quit());

app.whenReady().then(createWindow);
