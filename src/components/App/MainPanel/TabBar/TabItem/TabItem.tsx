import { ColorTheme, preferences } from '../../../../../common/preferences';
import './TabItem.css';

export enum TabItemIcon {
    Folder = 'folder',
    CompressedFolder = 'compressed_folder',
}

export type TabItemProps = {
    selected: boolean,
    title: string,
    icon: TabItemIcon,
};

export default function TabItem(props: TabItemProps) {
    const styles = {
        container: {
            backgroundColor: props.selected ? 'var(--selected-tab-color)' : 'var(--unselected-tab-color)',
        },
        icon: {
            backgroundImage: `url('./lib/img/icons/${preferences.appearance.theme}/${props.icon}.svg')`,
        },
    };

    return (
        <div className="tab-item-container" style={styles.container}>
            <div className="tab-item-icon" style={styles.icon} />
            {props.title}
        </div>
    );
}
