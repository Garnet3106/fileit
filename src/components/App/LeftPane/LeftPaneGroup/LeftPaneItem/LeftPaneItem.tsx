import { useDispatch, useSelector } from 'react-redux';
import { ItemPath } from '../../../../../common/fs/path';
import { RootState, slices } from '../../../../../common/redux';
import './LeftPaneItem.css';

export type LeftPaneItemData = {
    path: ItemPath,
};

export type LeftPaneItemProps = {
    data: LeftPaneItemData,
};

export const variables = {
    itemIconSize: 15,
};

export default function LeftPaneItem(props: LeftPaneItemProps) {
    const dispatch = useDispatch();
    const tab = useSelector((state: RootState) => state.tab);
    const isSelected = tab.selected?.path.isEqual(props.data.path) === true;

    const styles = {
        container: {
            backgroundColor: isSelected ? '#313136' : 'transparent',
        },
        itemIcon: {
            height: variables.itemIconSize,
            minWidth: variables.itemIconSize,
        },
    };

    return (
        <div className="left-pane-item" style={styles.container} onClick={onClick}>
            <div className="left-pane-item-icon" style={styles.itemIcon} />
            <div className="left-pane-item-text">
                {props.data.path.getIdentifier().toString()}
            </div>
        </div>
    );

    function onClick() {
        dispatch(slices.tab.actions.changePath(props.data.path));
    }
}
