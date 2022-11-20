import { ipcMessageSender } from "./ipc";

namespace NativeWindow {
    export function close() {
        ipcMessageSender.window.close();
    }

    export function minimize() {
        ipcMessageSender.window.minimize();
    }
}

export default NativeWindow;
