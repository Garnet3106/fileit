import { ItemPath } from "./fs/path";
import { homeDirectoryPath, Platform, platform } from "./utils";

function getElectron(): any {
    return window.require('electron');
}

export function sendIpcMessage(channel: string, ...args: any[]) {
    if (process.env.NODE_ENV === 'production') {
        getElectron().ipcRenderer.send(channel, ...args);
    } else {
        console.info(`[IPC send: ${channel}]`);
    }
}

export const ipcMessageSender = {
    env: {
        getPlatform: () => sendIpcMessage('get-platform'),
        getHomePath: () => sendIpcMessage('get-home-path'),
    },
    window: {
        close: () => sendIpcMessage('close-window'),
        minimize: () => sendIpcMessage('minimize-window'),
    },
    fs: {
        runFile: (path: string) => sendIpcMessage('run-file', path),
        trash: (path: string) => sendIpcMessage('trash-file', path),
    },
};

function initialize() {
    if (process.env.NODE_ENV === 'production') {
        const ipcRenderer = getElectron().ipcRenderer;

        ipcRenderer.on('get-platform', (_event: any, value: string) => {
            let newPlatform;

            switch (value) {
                case 'win32':
                newPlatform = Platform.Win32;
                break;

                case 'darwin':
                newPlatform = Platform.Darwin;
                break;

                case 'linux':
                newPlatform = Platform.Linux;
                break;

                default:
                newPlatform = Platform.Other;
                break;
            }

            platform.set(newPlatform);
        });

        ipcRenderer.on('get-home-path', (_event: any, value: string) => {
            homeDirectoryPath.set(ItemPath.from(value, true));
        });

        ipcMessageSender.env.getPlatform();
        ipcMessageSender.env.getHomePath();
    } else {
        platform.set(Platform.Other);
        homeDirectoryPath.set(new ItemPath(undefined, ['usr'], true));
    }
}

initialize();
