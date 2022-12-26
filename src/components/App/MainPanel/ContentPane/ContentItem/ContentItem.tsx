import { MouseEvent, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ipcMessageSender } from '../../../../../common/ipc';
import { Item } from '../../../../../common/fs/item';
import { ItemPropertyKind } from '../../../../../common/property';
import { RootState, slices } from '../../../../../common/redux';
import { PropertyBarItemData } from '../PropertyBar/PropertyBar';
import './ContentItem.css';
import { EventHandlerLayer, events } from '../../../../../common/event';

export type ContentItemProps = {
    item: Item,
    properties: PropertyBarItemData[],
    isSelected: boolean,
};

export const variables = {
    property: {
        horizontalMargin: 5,
        iconSize: 18,
    },
};

export const renameBarClassName = 'content-item-property content-item-property-rename';

export default function ContentItem(props: ContentItemProps) {
    const styles = {
        container: {
            padding: `${variables.property.horizontalMargin / 2}px 0`,
        },
        property: {
            marginLeft: `${(variables.property.horizontalMargin * 2) + 1}px`,
        },
        iconProperty: {
            backgroundImage: `url('../../../../../../lib/img/icons/dark/${props.item.isFile() ? 'file' : 'folder'}.svg')`,
            height: `${variables.property.iconSize}px`,
            minWidth: `${variables.property.iconSize}px`,
            width: `${variables.property.iconSize}px`,
        },
    };

    const dispatch = useDispatch();
    const renamingItemPath = useSelector((state: RootState) => state.renamingItemPath);
    const [renameBarValue, setRenameBarValue] = useState(props.item.getPath().getIdentifier().toString());
    // fix
    const isCtrlKeyDown = useRef(false);

    useEffect(() => {
        events.keyUp.addHandler(onKeyUpOrDown);
        events.keyDown.addHandler(onKeyUpOrDown, EventHandlerLayer.KeyDownLayer.KeyWatcher);

        return () => {
            events.keyUp.removeHandler(onKeyUpOrDown);
            events.keyDown.removeHandler(onKeyUpOrDown, EventHandlerLayer.KeyDownLayer.KeyWatcher);
        };
    }, [onKeyUpOrDown]);

    const properties = props.properties.map((eachProperty, index) => {
        const value = props.item.getPropertyValue(eachProperty.kind);

        const fixedWidthStyle = Object.assign(
            styles.property,
            {
                maxWidth: `${eachProperty.width}px`,
                minWidth: `${eachProperty.width}px`,
            },
        );

        switch (eachProperty.kind) {
            case ItemPropertyKind.Icon:
            return (
                <div
                    className="content-item-property content-item-property-icon"
                    style={Object.assign({}, styles.property, styles.iconProperty)}
                    key={index}
                />
            );

            case ItemPropertyKind.Name:
            return renamingItemPath?.isEqual(props.item.getPath()) !== true ? (
                <div
                    className="content-item-property content-item-property-name"
                    style={fixedWidthStyle}
                    key={index}
                >
                    {value}
                </div>
            ) : (
                <input
                    className={renameBarClassName}
                    style={fixedWidthStyle}
                    value={renameBarValue}
                    onChange={(e) => setRenameBarValue(e.target.value)}
                    key={index}
                />
            );

            default:
            return (
                <div
                    className="content-item-property"
                    style={fixedWidthStyle}
                    key={index}
                >
                    {value}
                </div>
            );
        }
    });

    return (
        <div
            className={`content-item-container ${props.isSelected ? 'content-item-container-selected' : ''}`}
            style={styles.container}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
        >
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
            dispatch(slices.tab.actions.changePath(props.item.getPath()));
        } else {
            ipcMessageSender.fs.runFile(props.item.getFullPath());
        }
    }
}
