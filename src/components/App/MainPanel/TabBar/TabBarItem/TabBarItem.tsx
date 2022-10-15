import { MouseEvent } from 'react';
import { preferences } from '../../../../../common/preferences';
import { Tab } from '../../../../../common/tab';
import './TabBarItem.css';

export type TabBarItemProps = {
    item: Tab,
    selected: boolean,
    onClick: (id: string) => void,
    onClickCloseIcon: (id: string) => void,
};

export default function TabBarItem(props: TabBarItemProps) {
    const styles = {
        container: {
            backgroundColor: props.selected ? 'var(--selected-tab-color)' : 'var(--unselected-tab-color)',
        },
        icon: {
            backgroundImage: `url('./lib/img/icons/${preferences.appearance.theme}/${props.item.icon}.svg')`,
        },
    };

    return (
        <div className="tab-bar-item-container" style={styles.container} onClick={onClick}>
            <div style={{
                alignItems: 'center',
                display: 'flex',
            }}>
                <div className="tab-bar-item-icon" style={styles.icon} />
                {props.item.title}
            </div>
            <div className="tab-bar-item-close" />
        </div>
    );

    function onClick(event: MouseEvent) {
        if (!(event.nativeEvent.target as HTMLElement).classList.contains('tab-bar-item-close')) {
            props.onClick(props.item.id);
        } else {
            props.onClickCloseIcon(props.item.id);
        }
    }
}
