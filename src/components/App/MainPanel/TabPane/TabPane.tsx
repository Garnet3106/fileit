import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { initialWorkingFolderPath, ItemPath } from '../../../../common/fs/path';
import NativeWindow from '../../../../common/native_window';
import { preferences } from '../../../../common/preferences';
import { RootState, slices, store } from '../../../../common/redux';
import { generateUuid } from '../../../../common/utils';
import './TabPane.css';
import TabPaneItem from './TabPaneItem/TabPaneItem';

export const variables = {
    height: 30,
};

export default function TabPane() {
    useEffect(() => {
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
        };
    });

    const dispatch = useDispatch();
    const tab = useSelector((state: RootState) => state.tab);

    const styles = {
        container: {
            backgroundColor: preferences.appearance.background.panel2,
            height: `${variables.height}px`,
        },
        items: {
            width: `calc(100vw - ${150 + 1}px)`,
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
                <div className="tab-pane-operation-icon tab-pane-operation-icon-minimize" onClick={NativeWindow.minimize} />
                <div className="tab-pane-operation-icon tab-pane-operation-icon-close" onClick={NativeWindow.close} />
            </div>
        </div>
    );

    function onKeyDown(event: KeyboardEvent) {
        if (event.ctrlKey && event.code === 'KeyT') {
            // rm
            event.preventDefault();
            open(initialWorkingFolderPath);
            return;
        }

        if (event.ctrlKey && event.code === 'KeyW') {
            if (tab.tabs.length !== 1) {
                event.preventDefault();
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
        const newTab = {
            id: generateUuid(),
            path: path,
        };

        dispatch(slices.tab.actions.open(newTab));
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

        dispatch(slices.tab.actions.close(id));
    }
}
