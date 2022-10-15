import NativeWindow from '../../../../common/nativewindow';
import { preferences } from '../../../../common/preferences';
import './TabBar.css';
import TabBarItem, { TabBarItemIcon } from './TabBarItem/TabBarItem';

export const variables = {
    height: 30,
};

export default function TabBar() {
    const styles = {
        container: {
            backgroundColor: preferences.appearance.background.panel2,
            height: `${variables.height}px`,
        },
        items: {
            width: `calc(100vw - ${150 + 1}px)`,
        },
    };

    return (
        <div className="tab-bar-container" style={styles.container}>
            <div className="tab-bar-items" style={styles.items}>
                <TabBarItem selected={true} title="Folder1" icon={TabBarItemIcon.Folder} />
                <TabBarItem selected={false} title="Folder2" icon={TabBarItemIcon.CompressedFolder} />
            </div>
            <div className="tab-bar-operations">
                <div className="tab-bar-operation-icon tab-bar-operation-icon-minimize" onClick={NativeWindow.minimize} />
                <div className="tab-bar-operation-icon tab-bar-operation-icon-close" onClick={NativeWindow.close} />
            </div>
        </div>
    );
}
