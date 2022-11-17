import { preferences } from '../../../../common/preferences';
import { generateUuid } from '../../../../common/utils';
import './OperationBar.css';
import OperationIcon from './OperationIcon/OperationIcon';
import { useDispatch, useSelector } from 'react-redux/es/exports';
import { RootState, slices } from '../../../../common/redux';
import { variables as leftPanelVariables } from '../../LeftPanel/LeftPanel';
import { ItemPath } from '../../../../common/item';
import Fs from '../../../../common/fs';

export const operationIconIds = {
    window: {
        prev: 'prev',
        next: 'next',
        reload: 'reload',
    },
    path: {
        copy: 'copy',
        edit: 'edit',
    },
    item: {
        copy: 'copy',
    },
};

export const variables = {
    height: (30 * 2) + (3 * 3),
};

export default function OperationBar() {
    const styles = {
        container: {
            backgroundColor: preferences.appearance.background.panel1,
            height: `${variables.height}px`,
        },
    };

    const dispatch = useDispatch();

    const currentFolderPath = useSelector((state: RootState) => state.currentFolderPath);
    const selectedItemPaths = useSelector((state: RootState) => state.selectedItemPaths);

    let fullDirPath = currentFolderPath?.getHierarchy() ?? [];

    if (currentFolderPath !== null) {
        const first = currentFolderPath.getDriveLetter() !== undefined ? currentFolderPath.getDriveLetter() + ':' : '/';
        fullDirPath = [first].concat(fullDirPath);
    }

    const pathItems = fullDirPath.map((eachPath, index) => (
        <div
            className="operation-bar-path-item"
            onClick={() => {
                const parent = currentFolderPath?.getParent(fullDirPath.length - index - 1);

                if (parent !== undefined) {
                    dispatch(slices.currentFolderPath.actions.update(parent));
                }
            }}
            key={generateUuid()}
        >
            {eachPath}
        </div>
    ));

    return (
        <div className="operation-bar-container" style={styles.container}>
            <div className="operation-bar-row">
                <div className="operation-bar-row-items">
                    <OperationIcon id={operationIconIds.window.prev} />
                    <OperationIcon id={operationIconIds.window.next} />
                    <OperationIcon id={operationIconIds.window.reload} />
                </div>
                <div className="operation-bar-row-items" style={{
                    // fix
                    width: `calc(100vw - ${leftPanelVariables.width + (90 + (3 * 2)) + (3 * 2)}px)`,
                }}>
                    <div className="operation-bar-path">
                        {pathItems}
                        {/* <div className="operation-bar-path-item">
                            C
                        </div>
                        <div className="operation-bar-path-item">
                            Users
                        </div>
                        <div className="operation-bar-path-item">
                            Garnet3106
                        </div>
                        <div className="operation-bar-path-item">
                            Desktop
                            <div style={{
                                display: 'flex',
                                marginLeft: 6,
                            }}>
                                <OperationIcon id={operationIconIds.path.copy} isMini={true} />
                                <OperationIcon id={operationIconIds.path.edit} isMini={true} />
                            </div>
                        </div> */}
                    </div>
                </div>
            </div>
            <div className="operation-bar-row">
                <div className="operation-bar-row-items">
                    <OperationIcon id={operationIconIds.item.copy} onClick={() => {
                        iterateSelectedPaths((path) => {
                            Fs.duplicate(path);
                        });
                    }} />
                </div>
            </div>
        </div>
    );

    function iterateSelectedPaths(callback: (path: ItemPath, index: number) => void) {
        selectedItemPaths.forEach(callback);
    }
}
