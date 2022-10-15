import { ItemPropertyKind } from '../../../../../../common/property';
import { PropertyBarItemData } from '../PropertyBar';
import './PropertyBarItem.css';

export type PropertyBarItemProps = {
    data: PropertyBarItemData,
};

export default function PropertyBarItem(props: PropertyBarItemProps) {
    const styles = {
        container: {
            cursor: props.data.grabbable === false ? undefined : 'grab',
            minWidth: props.data.width - 1,
        },
    };

    const icon = props.data.grabbable !== false ? <div className="property-bar-item-icon" /> : undefined;

    return (
        <div className="property-bar-item-container" style={styles.container}>
            {ItemPropertyKind.localizeName(props.data.kind)}
            {icon}
        </div>
    );
}
