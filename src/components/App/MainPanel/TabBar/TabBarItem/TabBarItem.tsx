import { preferences } from '../../../../../common/preferences';
import './TabBarItem.css';

export enum TabBarItemIcon {
    Folder = 'folder',
    CompressedFolder = 'compressed_folder',
}

export type TabBarItemProps = {
    selected: boolean,
    title: string,
    icon: TabBarItemIcon,
};

export default function TabBarItem(props: TabBarItemProps) {
    const styles = {
        container: {
            backgroundColor: props.selected ? 'var(--selected-tab-color)' : 'var(--unselected-tab-color)',
        },
        icon: {
            backgroundImage: `url('./lib/img/icons/${preferences.appearance.theme}/${props.icon}.svg')`,
        },
    };

    return (
        <div className="tab-bar-item-container" style={styles.container}>
            <div style={{
                alignItems: 'center',
                display: 'flex',
            }}>
                <div className="tab-bar-item-icon" style={styles.icon} />
                {props.title}
            </div>
            <div className="tab-bar-item-close" />
        </div>
    );
}
