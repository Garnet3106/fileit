import { Item } from '../../../../../common/item';
import { ItemPropertyKind } from '../../../../../common/property';
import { PropertyBarItemData } from '../PropertyBar/PropertyBar';
import './ContentItem.css';

export type ContentItemProps = {
    item: Item,
    properties: PropertyBarItemData[],
};

export default function ContentItem(props: ContentItemProps) {
    const styles = {
        icon: {
            backgroundImage: `url('../../../../../../lib/img/icons/dark/${props.item.isFile() ? 'file' : 'folder'}.svg')`,
        },
    };

    const properties = props.properties.map((eachProperty, index) => {
        const value = props.item.getPropertyValue(eachProperty.kind);
        switch (eachProperty.kind) {
            case ItemPropertyKind.Icon:
            return <div className="content-item-property content-item-property-icon" style={styles.icon} key={index} />;

            case ItemPropertyKind.Name:
            return <div className="content-item-property content-item-property-name" style={{
                width: `${eachProperty.width}px`,
            }} key={index}>{value}</div>;

            default:
            return <div className="content-item-property" style={{
                width: `${eachProperty.width}px`,
            }} key={index}>{value}</div>;
        }
    });

    return (
        <div className="content-item-container">
            {properties}
        </div>
    );
}
