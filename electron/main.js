const { BrowserWindow, app } = require("electron");
const path = require("path");

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.resolve(__dirname, "preload.js"),
        },
    });

    mainWindow.loadFile("build/index.html");
};

app.whenReady().then(createWindow);
app.once('window-all-closed', () => app.quit());
