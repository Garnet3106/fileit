import { ItemPath } from "./fs/path";
import { generateUuid, homeDirectoryPath, Platform, platform } from "./utils";

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
        extract: (src: string, dest: string) => {
            const id = generateUuid();
            sendIpcMessage('extract-item', id, src, dest);
            return id;
        },
    },
};

export type ExtractionHandler = (path: string) => void;

let extractionHandlerCallbacks = new Map<string, ExtractionHandler>();

export function addExtractionHandler(id: string, callback: ExtractionHandler) {
    if (process.env.NODE_ENV !== 'production') {
        console.warn('Cannot add extraction handler on environment other than production.');
    } else {
        extractionHandlerCallbacks.set(id, callback);
    }
}

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

        ipcRenderer.on('extract-item', (_event: any, value: any) => {
            switch (value.kind) {
                case 'data':
                const callback = extractionHandlerCallbacks.get(value.id);

                if (callback !== undefined) {
                    callback(value.value);
                }
                break;

                case 'end':
                case 'error':
                extractionHandlerCallbacks.delete(value.id);
                break;
            }
        });
    } else {
        platform.set(Platform.Other);
        homeDirectoryPath.set(new ItemPath(undefined, ['usr'], true));
    }
}

initialize();
