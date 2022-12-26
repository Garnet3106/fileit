export type PropagationStopper = () => void;

export type GlobalEventHandler<T extends Event> = (event: T, stopPropagation: PropagationStopper) => void;

export type GlobalEventHandlerMap = {
    mouseUp: GlobalEventHandler<MouseEvent>,
    mouseDown: GlobalEventHandler<MouseEvent>,
    mouseMove: GlobalEventHandler<MouseEvent>,
    keyUp: GlobalEventHandler<KeyboardEvent>,
    keyDown: GlobalEventHandler<KeyboardEvent>,
};

export const maxHandlerLength = 64;

export class GlobalEvent<T extends Event> {
    private layerOrder: number[];
    private handlers = new Map<number, GlobalEventHandler<T>[]>();

    constructor(layerOrder: number[] = [0]) {
        this.layerOrder = layerOrder;
    }

    // Returns global event finalizer. It must be called before app exits.
    public static initialize(): () => void {
        const handlers = {
            keyUp: GlobalEvent.dispatch(events.keyUp),
            keyDown: GlobalEvent.dispatch(events.keyDown),
            mouseUp: GlobalEvent.dispatch(events.mouseUp),
            mouseDown: GlobalEvent.dispatch(events.mouseDown),
            mouseMove: GlobalEvent.dispatch(events.mouseMove),
        };

        document.addEventListener('keyup', handlers.keyUp);
        document.addEventListener('keydown', handlers.keyDown);
        document.addEventListener('mouseup', handlers.mouseUp);
        document.addEventListener('mousedown', handlers.mouseDown);
        document.addEventListener('mousemove', handlers.mouseMove);

        return () => {
            document.removeEventListener('keyup', handlers.keyUp);
            document.removeEventListener('keydown', handlers.keyDown);
            document.removeEventListener('mouseup', handlers.mouseUp);
            document.removeEventListener('mousedown', handlers.mouseDown);
            document.removeEventListener('mousemove', handlers.mouseMove);
        };
    }

    private getHandlerLength(): number {
        let length = 0;

        this.layerOrder.forEach((eachLayer) => {
            length += this.handlers.get(eachLayer)?.length ?? 0;
        });

        return length;
    }

    public addHandler(handler: GlobalEventHandler<T>, layer: number = 0) {
        if (process.env.NODE_ENV !== 'production') {
            const handlerLength = this.getHandlerLength();

            if (maxHandlerLength <= handlerLength) {
                console.warn(`Handler length exceeded the limit (${handlerLength}).`);
                return;
            }
        }

        const layerValue = this.handlers.get(layer);

        if (layerValue === undefined) {
            this.handlers.set(layer, [handler]);
        } else {
            this.handlers.set(layer, [...layerValue, handler]);
        }
    }

    public removeHandler(handler: GlobalEventHandler<T>, layer: number = 0) {
        const layerValue = this.handlers.get(layer);

        if (layerValue === undefined) {
            return;
        }

        while (true) {
            const index = layerValue.findIndex((v) => v === handler);

            if (index < 0) {
                break;
            }

            layerValue.splice(index, 1);
        }

        this.handlers.set(layer, layerValue);
    }

    public static dispatch<T extends Event>(event: GlobalEvent<T>): (object: T) => void {
        return (object) => {
            event.layerOrder.some((eachLayer) => {
                const handlers = event.handlers.get(eachLayer);

                if (handlers === undefined) {
                    return false;
                }

                let propagate = true;
                const stopPropagation = () => propagate = false;

                handlers.forEach((eachHandler) => {
                    eachHandler(object, stopPropagation);
                });

                return !propagate;
            });
        };
    }
}

export namespace EventHandlerLayer {
    export enum KeyDownLayer {
        KeyWatcher,
        TabPane,
        DropdownItem,
        OperationPane,
        PreviewPopup,
        ContentPane,
    }
}

export const events = {
    keyUp: new GlobalEvent<KeyboardEvent>(),
    keyDown: new GlobalEvent<KeyboardEvent>([
        EventHandlerLayer.KeyDownLayer.KeyWatcher,
        EventHandlerLayer.KeyDownLayer.TabPane,
        EventHandlerLayer.KeyDownLayer.DropdownItem,
        EventHandlerLayer.KeyDownLayer.OperationPane,
        EventHandlerLayer.KeyDownLayer.PreviewPopup,
        EventHandlerLayer.KeyDownLayer.ContentPane,
    ]),
    mouseUp: new GlobalEvent<MouseEvent>(),
    mouseDown: new GlobalEvent<MouseEvent>(),
    mouseMove: new GlobalEvent<MouseEvent>(),
};
