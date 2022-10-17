import { useState } from 'react';
import Fs from '../../../../common/fs';
import { Item } from '../../../../common/item';
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

export let setDisplayDirPath: (path: string) => void = () => console.error('Item setter is not initialized yet.');

setTimeout(() => {
    setDisplayDirPath('C:/');
}, 1000);

export default function ContentPanel() {
    const [items, setItems] = useState<Item[]>([]);
    const [dirPath, setDirPath] = useState<string | null>(null);

    setDisplayDirPath = (path: string) => {
        setDirPath(path);

        Fs.getChildren(path)
            .then(setItems)
            .catch(alert)
    };

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
