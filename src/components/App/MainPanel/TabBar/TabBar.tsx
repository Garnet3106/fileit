import { useState } from 'react';
import UUIDClass from 'uuidjs';
import NativeWindow from '../../../../common/nativewindow';
import { preferences } from '../../../../common/preferences';
import { Tab, TabIcon } from '../../../../common/tab';
import './TabBar.css';
import TabBarItem from './TabBarItem/TabBarItem';

export const variables = {
    height: 30,
};

export default function TabBar() {
    const [tabs, setTabs] = useState<Tab[]>([]);
    const [selectedTabId, setSelectedTabId] = useState<string | null>(null);

    const styles = {
        container: {
            backgroundColor: preferences.appearance.background.panel2,
            height: `${variables.height}px`,
        },
        items: {
            width: `calc(100vw - ${150 + 1}px)`,
        },
    };

    const tabItems = tabs.map((eachTab) => (
        <TabBarItem
            item={eachTab}
            selected={eachTab.id === selectedTabId}
            onClick={selectTab}
            onClickCloseIcon={closeTab}
            key={eachTab.id}
        />
    ));

    return (
        <div className="tab-bar-container" style={styles.container}>
            <div className="tab-bar-items" style={styles.items}>
                {tabItems}
            </div>
            <div className="tab-bar-operations">
                <div className="tab-bar-operation-icon tab-bar-operation-icon-minimize" onClick={NativeWindow.minimize} />
                <div className="tab-bar-operation-icon tab-bar-operation-icon-close" onClick={NativeWindow.close} />
            </div>
        </div>
    );

    function searchTabIndex(id: string): number | undefined {
        const targetIndex = tabs.findIndex((eachTab) => eachTab.id === id);
        return targetIndex !== -1 ? targetIndex : undefined;
    }

    function openTab(title: string, icon: TabIcon) {
        const newTab = {
            id: UUIDClass.genV4().hexString,
            icon: icon,
            title: title,
        };

        setTabs((tabs) => [...tabs, newTab]);
        setSelectedTabId(newTab.id);
    }

    function selectTab(id: string) {
        if (searchTabIndex(id) === undefined) {
            console.error(`Couldn't operate unknown or unopened tab ID \`${id}\`.`);
            return;
        }

        setSelectedTabId(id);
    }

    function closeTab(id: string) {
        const targetIndex = searchTabIndex(id);

        if (targetIndex === undefined) {
            console.error(`Couldn't operate unknown or unopened tab ID \`${id}\`.`);
            return;
        }

        setTabs((tabs) => tabs.filter((eachTab) => eachTab.id !== id));

        if (id === selectedTabId) {
            setSelectedTabId(targetIndex > 0 ? tabs[targetIndex - 1].id : null);
        }
    }
}
