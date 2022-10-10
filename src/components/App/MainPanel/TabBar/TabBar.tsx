import { preferences } from '../../../../preferences';
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
    };

    return (
        <div className="tab-bar-container" style={styles.container}>
            <TabItem selected={true} title="Folder1" icon={TabItemIcon.Folder} />
            <TabItem selected={false} title="Folder2" icon={TabItemIcon.CompressedFolder} />
        </div>
    );
}
