function getElectron(): any {
    return window.require('electron');
}

export function sendMessageByIpc(channel: string, args: any[] = [], onDevEnv: () => void = () => {}) {
    if (process.env.NODE_ENV === 'production') {
        getElectron().ipcRenderer.send(channel, args);
    } else {
        console.info(`[IPC send: ${channel}]`);
        onDevEnv();
    }
}
