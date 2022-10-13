import './PropertyBar.css';
import PropertyBarItem from './PropertyBarItem/PropertyBarItem';

export enum ItemPropertyKind {
    Icon,
    Name,
    Size,
    LastModified,
};

export type PropertyBarItemData = {
    kind: ItemPropertyKind,
    width: number,
};

export type PropertyBarProps = {
    items: PropertyBarItemData[],
};

export default function PropertyBar(props: PropertyBarProps) {
    const items = props.items.map((eachItem) => (
        <PropertyBarItem data={eachItem} />
    ));

    return (
        <div className="property-bar-container">
            {items}
        </div>
    );
}
