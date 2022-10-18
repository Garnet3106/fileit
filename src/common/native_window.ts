import { sendMessageByIpc } from "./ipc";

namespace NativeWindow {
    export function close() {
        sendMessageByIpc('close-window');
    }

    export function minimize() {
        sendMessageByIpc('minimize-window');
    }
}

export default NativeWindow;
