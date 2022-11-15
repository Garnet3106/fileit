import { preferences } from '../../../../common/preferences';
import { generateUuid } from '../../../../common/utils';
import './OperationBar.css';
import OperationIcon from './OperationIcon/OperationIcon';
import { useSelector } from 'react-redux/es/exports';
import { RootState } from '../../../../common/redux';

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

    const path = useSelector((state: RootState) => state.path);
    // const itemId = path.getIdentifier().length !== 0 ? path.getIdentifier() : '/';
    let fullDirPath = path?.getHierarchy() ?? [];

    if (path !== null) {
        const first = path.getDriveLetter() !== undefined ? path.getDriveLetter() + ':' : '/';
        fullDirPath = [first].concat(fullDirPath);
    }

    const pathItems = fullDirPath.map((eachPath) => (
        <div className="operation-bar-path-item" key={generateUuid()}>
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
                <div className="operation-bar-row-items">
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
                    <OperationIcon id={operationIconIds.window.prev} />
                </div>
            </div>
        </div>
    );
}
