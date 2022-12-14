import { useEffect, useRef } from 'react';
import { variables as detailBarVariables } from '../DetailBar/DetailBar';
import { variables as operationPaneVariables } from '../OperationPane/OperationPane';
import { variables as tabPaneVariables } from '../TabPane/TabPane';
import ContentItem from './ContentItem/ContentItem';
import './ContentPane.css';
import PropertyBar, { ItemPropertyKind } from './PropertyBar/PropertyBar';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, slices, store } from '../../../../common/redux';
import Fs from '../../../../common/fs/fs';
import { ItemPath } from '../../../../common/fs/path';
import PreviewPopup from './PreviewPopup/PreviewPopup';
import { Item, ItemSortOrder } from '../../../../common/fs/item';
import { ipcMessageSender } from '../../../../common/ipc';

export const variables = {
    propertyItemHorizontalMargin: 5,
    contentItemIconSize: 18,
};

// fix
const initialDriveLetter = process.env.NODE_ENV === 'production' ? 'C' : undefined;
export const initialPath = new ItemPath(initialDriveLetter, [], true);

export default function ContentPane() {
    useEffect(() => {
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [onKeyDown]);

    const dispatch = useDispatch();
    const currentFolderChildren = useSelector((state: RootState) => state.currentFolderChildren);
    const selectedItemPaths = useSelector((state: RootState) => state.selectedItemPaths);
    const itemSortOrder = useSelector((state: RootState) => state.itemSortOrder);
    const latestCurrentFolderPath = useRef(slices.currentFolderPath.getInitialState());
    const renamingItemPath = useSelector((state: RootState) => state.renamingItemPath);
    const showPathEditBar = useSelector((state: RootState) => state.showPathEditBar);

    useEffect(() => {
        dispatch(slices.currentFolderPath.actions.update(initialPath));
    }, []);

    useEffect(() => {
        // Unselect item paths which not exists.
        selectedItemPaths.forEach((eachPath) => {
            if (!Fs.exists(eachPath)) {
                dispatch(slices.selectedItemPaths.actions.remove(eachPath));
            }
        });
    });

    store.subscribe(() => {
        const currentFolderPath = store.getState().currentFolderPath;

        if (currentFolderPath !== null && latestCurrentFolderPath.current?.isEqual(currentFolderPath) !== true) {
            reloadItems(currentFolderPath);
        }

        latestCurrentFolderPath.current = currentFolderPath;
    });

    const styles = {
        container: {
            height: `calc(100% - ${tabPaneVariables.height + operationPaneVariables.height + detailBarVariables.height}px)`,
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

    const itemElems = currentFolderChildren.map((eachItem) => (
        <ContentItem item={eachItem} properties={properties} isSelected={selectedItemPaths.some((v) => v.isEqual(eachItem.getPath()))} key={eachItem.getFullPath()} />
    ));

    return (
        <div className="content-pane-container" style={styles.container}>
            <PropertyBar items={properties} />
            <div className="content-pane-items">
                {itemElems}
            </div>
            <PreviewPopup />
        </div>
    );

    // Do not modify `currentFolderPath` state in this function. It would cause infinite recursion.
    function reloadItems(folderPath: ItemPath) {
        Fs.getChildren(folderPath)
            .then((items) => dispatch(slices.currentFolderChildren.actions.update(items.sort(getItemSorter()))))
            .catch(console.error);

        Fs.watch(folderPath, () => reloadItems(folderPath));
    }

    function getItemSorter(): (a: Item, b: Item) => number {
        switch (itemSortOrder) {
            case ItemSortOrder.NameAscend:
            return (a, b) => a.getIdentifier().toString().localeCompare(b.getIdentifier().toString());

            case ItemSortOrder.NameDescend:
            return (a, b) => a.getIdentifier().toString().localeCompare(b.getIdentifier().toString()) * -1;

            default:
            console.error('unimplemented');
            return () => 0;
        }
    }

    function onKeyDown(event: KeyboardEvent) {
        if (event.ctrlKey) {
            return;
        }

        const getSelectedItemIndex = () => {
            const currentItem = selectedItemPaths.at(selectedItemPaths.length - 1);
            let selectedItemIndex = 0;

            const isSelectedItemFound = currentItem !== undefined ? (
                currentFolderChildren.some((eachItem) => {
                    if (eachItem.getFullPath() === currentItem.getFullPath()) {
                        return true;
                    }

                    selectedItemIndex += 1;
                })
            ) : false;

            return isSelectedItemFound ? selectedItemIndex : undefined;
        };

        if (!event.shiftKey && event.code === 'ArrowUp') {
            const selectedItemIndex = getSelectedItemIndex();
            let newPaths = selectedItemPaths;

            if (selectedItemIndex === undefined) {
                const targetItem = currentFolderChildren.at(currentFolderChildren.length - 1);

                if (targetItem !== undefined) {
                    newPaths = [targetItem.getPath()];
                }
            } else {
                const targetItem = currentFolderChildren.at(selectedItemIndex - 1);

                if (targetItem === undefined) {
                    const targetItem = currentFolderChildren.at(currentFolderChildren.length - 1);

                    if (targetItem !== undefined) {
                        newPaths = [targetItem.getPath()];
                    }
                } else {
                    newPaths = [targetItem.getPath()];
                }
            }

            dispatch(slices.selectedItemPaths.actions.update(newPaths));
            event.preventDefault();
            return;
        }

        if (!event.shiftKey && event.code === 'ArrowDown') {
            const selectedItemIndex = getSelectedItemIndex();
            let newPaths = selectedItemPaths;

            if (selectedItemIndex === undefined) {
                const targetItem = currentFolderChildren.at(0);

                if (targetItem !== undefined) {
                    newPaths = [targetItem.getPath()];
                }
            } else {
                const targetItem = currentFolderChildren.at(selectedItemIndex + 1);

                if (targetItem === undefined) {
                    const targetItem = currentFolderChildren.at(0);

                    if (targetItem !== undefined) {
                        newPaths = [targetItem.getPath()];
                    }
                } else {
                    newPaths = [targetItem.getPath()];
                }
            }

            dispatch(slices.selectedItemPaths.actions.update(newPaths));
            event.preventDefault();
            return;
        }

        if (event.code === 'Enter') {
            selectedItemPaths.forEach((eachPath) => {
                if (eachPath.isFolder()) {
                    // fix: add new tabs
                    dispatch(slices.currentFolderPath.actions.update(eachPath));
                } else {
                    ipcMessageSender.fs.runFile(eachPath.getFullPath());
                }
            });

            return;
        }

        if (
            event.code === 'Escape' &&
            selectedItemPaths.length !== 0 &&
            !showPathEditBar &&
            renamingItemPath === null
        ) {
            dispatch(slices.selectedItemPaths.actions.update([]));
            return;
        }
    }
}
