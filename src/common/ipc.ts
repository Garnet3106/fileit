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
    window: {
        close: () => sendIpcMessage('close-window'),
        minimize: () => sendIpcMessage('minimize-window'),
    },
    fs: {
        runFile: (path: string) => sendIpcMessage('run-file', path),
    },
};
