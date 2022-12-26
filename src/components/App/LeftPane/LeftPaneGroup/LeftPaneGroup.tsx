import './LeftPaneGroup.css';
import LeftPaneItem, { LeftPaneItemData } from './LeftPaneItem/LeftPaneItem';

export type LeftPaneItem = {
    text: string,
    onClick: () => void,
};

export type LeftPaneGroupProps = {
    items: LeftPaneItemData[],
};

export const variables = {
    itemIconSize: 15,
};

export default function LeftPaneGroup(props: LeftPaneGroupProps) {
    const items = props.items.map((eachItem, index) => (
        <LeftPaneItem data={eachItem} key={index} />
    ));

    return (
        <div className="left-pane-group">
            {items}
        </div>
    );
}
