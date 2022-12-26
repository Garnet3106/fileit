import { MouseEvent } from 'react';
import { useSelector } from 'react-redux';
import { FileItemIdentifier } from '../../../../../common/fs/path';
import { RootState } from '../../../../../common/redux';
import { Tab, TabIcon } from '../../../../../common/tab';
import './TabPaneItem.css';

export type TabPaneItemProps = {
    item: Tab,
    selected: boolean,
    onClick: (id: string) => void,
    onClickCloseIcon: (id: string) => void,
};

export default function TabPaneItem(props: TabPaneItemProps) {
    const path = props.item.path;
    const title = path.getIdentifier().toString();
    const icon = !path.isFolder() && (path.getIdentifier() as FileItemIdentifier).isCompressed() ? TabIcon.CompressedFolder : TabIcon.Folder;
    const appearanceTheme = useSelector((state: RootState) => state.preferences.appearance.theme);

    const styles = {
        container: {
            backgroundColor: props.selected ? 'var(--selected-tab-color)' : 'var(--unselected-tab-color)',
        },
        icon: {
            backgroundImage: `url('./lib/img/icons/${appearanceTheme}/${icon}.svg')`,
        },
    };

    return (
        <div className="tab-pane-item-container" style={styles.container} onClick={onClick}>
            <div style={{
                alignItems: 'center',
                display: 'flex',
            }}>
                <div className="tab-pane-item-icon" style={styles.icon} />
                {title}
            </div>
            <div className="tab-pane-item-close" />
        </div>
    );

    function onClick(event: MouseEvent) {
        if (!(event.nativeEvent.target as HTMLElement).classList.contains('tab-pane-item-close')) {
            props.onClick(props.item.id);
        } else {
            props.onClickCloseIcon(props.item.id);
        }
    }
}
