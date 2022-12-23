const { BrowserWindow, app, ipcMain, shell } = require('electron');
const electronReload = require('electron-reload');
const isDev = require('electron-is-dev');
const path = require('path');
const sZip = require('node-7z');

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

ipcMain.on('compress-item', (event, id, src, dest) => {
    const stream = sZip.add(dest, src, {
        $progress: true,
        recursive: true,
    });

    stream.on('progress', (progress) => event.reply('compress-item', {
        id: id,
        kind: 'progress',
        value: progress.percent,
    }));

    stream.on('end', () => event.reply('compress-item', {
        id: id,
        kind: 'end',
    }));

    stream.on('error', (error) => event.reply('compress-item', {
        id: id,
        kind: 'error',
        value: error,
    }));
});

ipcMain.on('extract-item', (event, id, src, dest) => {
    const stream = sZip.extractFull(src, dest);

    stream.on('progress', (progress) => event.reply('extract-item', {
        id: id,
        kind: 'progress',
        value: progress.percent,
    }));

    stream.on('end', () => event.reply('extract-item', {
        id: id,
        kind: 'end',
    }));

    stream.on('error', (error) => event.reply('extract-item', {
        id: id,
        kind: 'error',
        value: error,
    }));
});

app.once('window-all-closed', () => app.quit());

app.whenReady().then(createWindow);
