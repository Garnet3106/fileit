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
        compress: (src: string[], dest: string) => {
            const id = generateUuid();
            sendIpcMessage('compress-item', id, src, dest);
            return id;
        },
        extract: (src: string, dest: string) => {
            const id = generateUuid();
            sendIpcMessage('extract-item', id, src, dest);
            return id;
        },
    },
};

export type ProgressHandlerCallback = (progress: number) => void;
export type ProgressErrorHandlerCallback = (error: any) => void;

export class ProgressHandler {
    public onProgress?: ProgressHandlerCallback;
    public onError?: ProgressErrorHandlerCallback;
    public progress: number = 0;

    public then(callback: ProgressHandlerCallback): ProgressHandler {
        this.onProgress = callback;
        return this;
    }

    public catch(callback: ProgressErrorHandlerCallback): ProgressHandler {
        this.onError = callback;
        return this;
    }

    // Returns whether progress increased.
    setProgress(progress: number): boolean {
        const increased = this.progress < progress;
        this.progress = progress;
        return increased;
    }
}

export class ProgressEvent {
    private handlers = new Map<string, ProgressHandler>();

    public addHandler(id: string, handler: ProgressHandler) {
        this.handlers.set(id, handler);
    }

    // Returns whether handler existed and has been deleted.
    public removeHandler(id: string): boolean {
        return this.handlers.delete(id);
    }

    private getHandler(id: string): ProgressHandler | undefined {
        const handler = this.handlers.get(id);

        if (handler === undefined) {
            console.warn('Provided ID of progress event handler does not exist.');
        }

        return handler;
    }

    public progress(id: string, progress: number) {
        const handler = this.getHandler(id);

        if (handler === undefined) {
            return;
        }

        if (handler.setProgress(progress) && handler.onProgress !== undefined) {
            handler.onProgress(progress);
        }
    }
}

export const progressEvents = {
    compression: new ProgressEvent(),
    extraction: new ProgressEvent(),
};

let isInitialized = false;

function initializeIpc() {
    if (isInitialized) {
        console.warn('IPC initializer called multiple times.');
        return;
    }

    isInitialized = true;

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

        const addProgressEvents = (channel: string, event: ProgressEvent) => {
            ipcRenderer.on(channel, (_event: any, value: any) => {
                switch (value.kind) {
                    case 'progress':
                    event.progress(value.id, value.value);
                    break;

                    case 'end':
                    event.progress(value.id, 100);
                    event.removeHandler(value.id);
                    break;

                    case 'error':
                    console.error(value.value);
                    break;
                }
            });
        }

        addProgressEvents('compress-item', progressEvents.compression);
        addProgressEvents('extract-item', progressEvents.extraction);
    } else {
        platform.set(Platform.Other);
        homeDirectoryPath.set(new ItemPath(undefined, ['usr'], true));
    }
}

initializeIpc();
