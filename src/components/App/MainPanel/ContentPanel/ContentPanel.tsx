import { useEffect, useRef, useState } from 'react';
import { Item, ItemPath } from '../../../../common/item';
import { variables as detailBarVariables } from '../DetailBar/DetailBar';
import { variables as operationBarVariables } from '../OperationBar/OperationBar';
import { variables as tabBarVariables } from '../TabBar/TabBar';
import ContentItem from './ContentItem/ContentItem';
import './ContentPanel.css';
import PropertyBar, { ItemPropertyKind } from './PropertyBar/PropertyBar';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, slices, store } from '../../../../common/redux';
import Fs from '../../../../common/fs';

export const variables = {
    propertyItemHorizontalMargin: 5,
    contentItemIconSize: 18,
};

export const initialPath = new ItemPath(undefined, [], true);

export default function ContentPanel() {
    const [items, setItems] = useState<Item[]>([]);
    const dispatch = useDispatch();
    const selectedItemPaths = useSelector((state: RootState) => state.selectedItemPaths);
    const latestCurrentFolderPath = useRef(slices.currentFolderPath.getInitialState());

    useEffect(() => {
        dispatch(slices.currentFolderPath.actions.update(initialPath));
    }, []);

    store.subscribe(() => {
        const currentFolderPath = store.getState().currentFolderPath;

        if (currentFolderPath !== null && latestCurrentFolderPath.current?.isEqual(currentFolderPath) !== true) {
            reloadItems(currentFolderPath);
        }

        latestCurrentFolderPath.current = currentFolderPath;
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

    const itemElems = items.map((eachItem) => (
        <ContentItem item={eachItem} properties={properties} isSelected={selectedItemPaths.some((v) => v.isEqual(eachItem.getPath()))} key={eachItem.getFullPath()} />
    ));

    return (
        <div className="content-panel-container" style={styles.container}>
            <PropertyBar items={properties} />
            <div className="content-panel-items">
                {itemElems}
            </div>
        </div>
    );

    // Do not modify store data in this function. It may cause infinite recursion.
    function reloadItems(folderPath: ItemPath) {
        Fs.getChildren(folderPath)
            .then(setItems)
            .catch(console.error);

        Fs.watch(folderPath, () => reloadItems(folderPath));
    }
}
