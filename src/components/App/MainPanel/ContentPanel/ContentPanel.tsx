import { Item } from '../../../../item';
import { variables as detailBarVariables } from '../DetailBar/DetailBar';
import { variables as operationBarVariables } from '../OperationBar/OperationBar';
import { variables as tabBarVariables } from '../TabBar/TabBar';
import ContentItem from './ContentItem/ContentItem';
import './ContentPanel.css';
import PropertyBar, { ItemPropertyKind } from './PropertyBar/PropertyBar';

export const variables = {
    propertyItemHorizontalMargin: 5,
    contentItemIconSize: 18,
};

export type ContentPanelProps = {
    items: Item[],
};

export default function ContentPanel(props: ContentPanelProps) {
    const styles = {
        container: {
            height: `calc(100% - ${tabBarVariables.height + operationBarVariables.height + detailBarVariables.height}px)`,
        },
    };

    const properties = [
        {
            kind: ItemPropertyKind.Icon,
            width: variables.contentItemIconSize + (variables.propertyItemHorizontalMargin * 2),
            grabbable: false,
        },
        {
            kind: ItemPropertyKind.Name,
            width: 150,
        },
        {
            kind: ItemPropertyKind.Size,
            width: 100,
        },
        {
            kind: ItemPropertyKind.LastModified,
            width: 100,
        },
    ];

    const items = props.items.map((eachItem, index) => <ContentItem item={eachItem} key={index} />);

    return (
        <div className="content-panel-container" style={styles.container}>
            <PropertyBar items={properties} />
            <div className="content-panel-items">
                {items}
            </div>
        </div>
    );
}
