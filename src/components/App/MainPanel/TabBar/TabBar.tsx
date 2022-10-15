import { preferences } from '../../../../common/preferences';
import './TabBar.css';
import TabItem, { TabItemIcon } from './TabItem/TabItem';

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
                <TabItem selected={true} title="Folder1" icon={TabItemIcon.Folder} />
                <TabItem selected={false} title="Folder2" icon={TabItemIcon.CompressedFolder} />
            </div>
            <div className="tab-bar-operations">
                <div className="tab-bar-operation-icon" style={{
                    backgroundImage: `url(../../../../../../lib/img/icons/dark/window/minimize.svg)`,
                }} />
                <div className="tab-bar-operation-icon" style={{
                    backgroundImage: `url(../../../../../../lib/img/icons/dark/window/close.svg)`,
                }} />
            </div>
        </div>
    );
}
