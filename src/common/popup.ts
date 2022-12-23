import { slices, store } from "./redux";

export namespace Popup {
    export const defaultClosingTimeout = 3000;

    export function isOpen(id: string): boolean {
        const popups = store.getState().popups;
        return popups.has(id);
    }

    export function close(id: string) {
        if (Popup.isOpen(id)) {
            store.dispatch(slices.popups.actions.remove(id));
        }
    }
}
