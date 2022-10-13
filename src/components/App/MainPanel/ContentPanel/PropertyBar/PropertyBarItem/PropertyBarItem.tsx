import { ItemPropertyKind } from '../../../../../../property';
import { PropertyBarItemData } from '../PropertyBar';
import './PropertyBarItem.css';

export type PropertyBarItemProps = {
    data: PropertyBarItemData,
};

export default function PropertyBarItem(props: PropertyBarItemProps) {
    const styles = {
        container: {
            cursor: props.data.grabbable === false ? undefined : 'grab',
            width: props.data.width,
        },
    };

    return (
        <div className="property-bar-item-container" style={styles.container}>
            {ItemPropertyKind.localizeName(props.data.kind)}
            <div className="property-bar-item-icon" />
        </div>
    );
}
