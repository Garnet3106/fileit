import { MouseEvent, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ipcMessageSender } from '../../../../../common/ipc';
import { Item } from '../../../../../common/fs/item';
import { ItemPropertyKind } from '../../../../../common/property';
import { RootState, slices } from '../../../../../common/redux';
import { PropertyBarItemData } from '../PropertyBar/PropertyBar';
import './ContentItem.css';

export type ContentItemProps = {
    item: Item,
    properties: PropertyBarItemData[],
    isSelected: boolean,
};

export const renameBarClassName = 'content-item-property content-item-property-rename';

export default function ContentItem(props: ContentItemProps) {
    const styles = {
        icon: {
            backgroundImage: `url('../../../../../../lib/img/icons/dark/${props.item.isFile() ? 'file' : 'folder'}.svg')`,
        },
    };

    const dispatch = useDispatch();
    const renamingItemPath = useSelector((state: RootState) => state.renamingItemPath);
    const wasRenaming = useRef(false);
    // fix
    const isCtrlKeyDown = useRef(false);

    useEffect(() => {
        document.addEventListener('keyup', onKeyUpOrDown);
        document.addEventListener('keydown', onKeyUpOrDown);

        return () => {
            document.removeEventListener('keyup', onKeyUpOrDown);
            document.removeEventListener('keydown', onKeyUpOrDown);
        };
    }, [onKeyUpOrDown]);

    const properties = props.properties.map((eachProperty, index) => {
        const value = props.item.getPropertyValue(eachProperty.kind);

        switch (eachProperty.kind) {
            case ItemPropertyKind.Icon:
            return (
                <div className="content-item-property content-item-property-icon" style={styles.icon} key={index} />
            );

            case ItemPropertyKind.Name:
            return renamingItemPath?.isEqual(props.item.getPath()) !== true ? (
                <div className="content-item-property content-item-property-name" style={{
                    maxWidth: `${eachProperty.width}px`,
                    minWidth: `${eachProperty.width}px`,
                }} key={index}>
                    {value}
                </div>
            ) : (
                <input className={renameBarClassName} style={{
                    maxWidth: `${eachProperty.width}px`,
                    minWidth: `${eachProperty.width}px`,
                }} key={index} />
            );

            default:
            return (
                <div className="content-item-property" style={{
                    maxWidth: `${eachProperty.width}px`,
                    minWidth: `${eachProperty.width}px`,
                }} key={index}>
                    {value}
                </div>
            );
        }
    });

    return (
        <div className={`content-item-container ${props.isSelected ? 'content-item-container-selected' : ''}`} onClick={onClick} onDoubleClick={onDoubleClick}>
            {properties}
        </div>
    );

    function onKeyUpOrDown(event: KeyboardEvent) {
        isCtrlKeyDown.current = event.ctrlKey;
    }

    function onClick() {
        const path = props.item.getPath();
        const actions = slices.selectedItemPaths.actions;
        let updateAction;

        if (isCtrlKeyDown.current) {
            updateAction = props.isSelected ? actions.remove(path) : actions.add(path);
        } else {
            updateAction = actions.update([path]);
        }

        dispatch(updateAction);
    }

    function onDoubleClick(event: MouseEvent) {
        const target = event.target as HTMLElement;

        if (target.className === renameBarClassName) {
            return;
        }

        if (props.item.isFolder()) {
            dispatch(slices.currentFolderPath.actions.update(props.item.getPath()));
        } else {
            ipcMessageSender.fs.runFile(props.item.getFullPath());
        }
    }
}
