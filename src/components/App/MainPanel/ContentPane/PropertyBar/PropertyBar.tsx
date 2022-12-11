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
    grabbable?: boolean,
};

export type PropertyBarProps = {
    items: PropertyBarItemData[],
};

export default function PropertyBar(props: PropertyBarProps) {
    const items = props.items.map((eachItem, index) => <PropertyBarItem data={eachItem} key={index} />);

    return (
        <div className="property-bar-container">
            {items}
        </div>
    );
}
