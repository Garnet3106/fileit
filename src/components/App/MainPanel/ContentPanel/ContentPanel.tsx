import { useEffect, useState } from 'react';
import { Item, ItemPath } from '../../../../common/item';
import { variables as detailBarVariables } from '../DetailBar/DetailBar';
import { variables as operationBarVariables } from '../OperationBar/OperationBar';
import { variables as tabBarVariables } from '../TabBar/TabBar';
import ContentItem from './ContentItem/ContentItem';
import './ContentPanel.css';
import PropertyBar, { ItemPropertyKind } from './PropertyBar/PropertyBar';
import { useDispatch } from 'react-redux';
import { slices, store } from '../../../../common/redux';
import Fs from '../../../../common/fs';

export const variables = {
    propertyItemHorizontalMargin: 5,
    contentItemIconSize: 18,
};

export default function ContentPanel() {
    const [items, setItems] = useState<Item[]>([]);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(slices.path.actions.update(new ItemPath([], '', true)));
    }, []);

    store.subscribe(() => {
        const state = store.getState();
        Fs.getChildren(state.path)
            .then(setItems)
            .catch(alert);
    });

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

    const itemElems = items.map((eachItem, index) => <ContentItem item={eachItem} properties={properties} key={index} />);

    return (
        <div className="content-panel-container" style={styles.container}>
            <PropertyBar items={properties} />
            <div className="content-panel-items">
                {itemElems}
            </div>
        </div>
    );
}
