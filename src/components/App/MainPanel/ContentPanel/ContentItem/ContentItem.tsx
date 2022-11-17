import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Item } from '../../../../../common/item';
import { ItemPropertyKind } from '../../../../../common/property';
import { slices } from '../../../../../common/redux';
import { PropertyBarItemData } from '../PropertyBar/PropertyBar';
import './ContentItem.css';

export type ContentItemProps = {
    item: Item,
    properties: PropertyBarItemData[],
    isSelected: boolean,
};

export default function ContentItem(props: ContentItemProps) {
    const styles = {
        icon: {
            backgroundImage: `url('../../../../../../lib/img/icons/dark/${props.item.isFile() ? 'file' : 'folder'}.svg')`,
        },
    };

    const dispatch = useDispatch();
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
            return <div className="content-item-property content-item-property-icon" style={styles.icon} key={index} />;

            case ItemPropertyKind.Name:
            return <div className="content-item-property content-item-property-name" style={{
                maxWidth: `${eachProperty.width}px`,
                minWidth: `${eachProperty.width}px`,
            }} key={index}>{value}</div>;

            default:
            return <div className="content-item-property" style={{
                maxWidth: `${eachProperty.width}px`,
                minWidth: `${eachProperty.width}px`,
            }} key={index}>{value}</div>;
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

    function onDoubleClick() {
        if (props.item.isFolder()) {
            dispatch(slices.currentFolderPath.actions.update(props.item.getPath()));
        } else {
            // unimplemented
        }
    }
}
