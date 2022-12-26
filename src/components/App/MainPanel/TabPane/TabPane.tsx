import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EventHandlerLayer, events, PropagationStopper } from '../../../../common/event';
import { ItemPath } from '../../../../common/fs/path';
import NativeWindow from '../../../../common/native_window';
import { RootState, slices, store } from '../../../../common/redux';
import { platform } from '../../../../common/utils';
import './TabPane.css';
import TabPaneItem from './TabPaneItem/TabPaneItem';

export const variables = {
    height: 30,
    dragAreaWidth: 100,
    operationIconSize: 30,
};

export default function TabPane() {
    useEffect(() => {
        events.keyDown.addHandler(onKeyDown, EventHandlerLayer.KeyDownLayer.TabPane);

        return () => {
            events.keyDown.removeHandler(onKeyDown, EventHandlerLayer.KeyDownLayer.TabPane);
        };
    }, [onKeyDown]);

    const dispatch = useDispatch();
    const tab = useSelector((state: RootState) => state.tab);

    useEffect(() => {
        platform.get((platform) => {
            const tabs = store.getState().tab.tabs;

            // Prevent from opening multiple tabs when opening the first tab.
            if (tabs.length === 0) {
                dispatch(slices.tab.actions.open(ItemPath.getRoot(platform)));
            }
        });
    }, []);

    const styles = {
        container: {
            height: `${variables.height}px`,
        },
        items: {
            width: `calc(100vw - ${150 + 1 + variables.dragAreaWidth}px)`,
        },
        operationIcon: {
            height: `${variables.operationIconSize}px`,
            width: `${variables.operationIconSize}px`,
        },
    };

    const tabItems = tab.tabs.map((eachTab) => (
        <TabPaneItem
            item={eachTab}
            selected={eachTab.id === tab.selected?.id}
            onClick={select}
            onClickCloseIcon={close}
            key={eachTab.id}
        />
    ));

    return (
        <div className="tab-pane-container" style={styles.container}>
            <div className="tab-pane-items" style={styles.items}>
                {tabItems}
            </div>
            <div className="tab-pane-operations">
                <div
                    className="tab-pane-operation-icon tab-pane-operation-icon-minimize"
                    style={styles.operationIcon}
                    onClick={NativeWindow.minimize}
                />
                <div
                    className="tab-pane-operation-icon tab-pane-operation-icon-close"
                    style={styles.operationIcon}
                    onClick={NativeWindow.close}
                />
            </div>
        </div>
    );

    function onKeyDown(event: KeyboardEvent, stopPropagation: PropagationStopper) {
        if (event.ctrlKey && event.code === 'KeyT') {
            // rm
            event.preventDefault();
            stopPropagation();

            platform.get((platform) => {
                open(ItemPath.getRoot(platform));
            });

            return;
        }

        if (event.ctrlKey && event.code === 'KeyW') {
            event.preventDefault();
            stopPropagation();

            if (tab.tabs.length === 1) {
                NativeWindow.close();
                return;
            }

            if (tab.selected !== null) {
                close(tab.selected.id);
            }

            return;
        }
    }

    function findTabIndex(id: string): number | undefined {
        const targetIndex = tab.tabs.findIndex((eachTab) => eachTab.id === id);
        return targetIndex === -1 ? undefined : targetIndex;
    }

    function open(path: ItemPath) {
        dispatch(slices.tab.actions.open(path));
    }

    function select(id: string) {
        if (findTabIndex(id) === undefined) {
            console.error(`Couldn't operate unknown or unopened tab ID \`${id}\`.`);
            return;
        }

        dispatch(slices.tab.actions.select(id));
    }

    function close(id: string) {
        if (findTabIndex(id) === undefined) {
            console.error(`Couldn't operate unknown or unopened tab ID \`${id}\`.`);
            return;
        }

        if (tab.tabs.length === 1) {
            NativeWindow.close();
            return;
        }

        dispatch(slices.tab.actions.close(id));
    }
}
