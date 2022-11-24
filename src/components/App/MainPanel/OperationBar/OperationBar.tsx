import { preferences } from '../../../../common/preferences';
import { generateUuid } from '../../../../common/utils';
import './OperationBar.css';
import OperationIcon from './OperationIcon/OperationIcon';
import { useDispatch, useSelector } from 'react-redux/es/exports';
import { RootState, slices, store } from '../../../../common/redux';
import { variables as leftPanelVariables } from '../../LeftPanel/LeftPanel';
import Fs, { FsErrorKind } from '../../../../common/fs/fs';
import { ItemPath } from '../../../../common/fs/path';
import { createRef, useEffect, useState } from 'react';
import { ItemKind } from '../../../../common/fs/item';

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
    const [showPathEditBar, setShowPathEditBar] = useState(false);

    const styles = {
        container: {
            backgroundColor: preferences.appearance.background.panel1,
            height: `${variables.height}px`,
        },
        operationBarPath: {
            display: showPathEditBar ? 'none' : 'flex',
        },
        operationBarPathEdit: {
            display: showPathEditBar ? 'block' : 'none',
        },
    };

    const dispatch = useDispatch();

    const currentFolderPath = useSelector((state: RootState) => state.currentFolderPath);
    const selectedItemPaths = useSelector((state: RootState) => state.selectedItemPaths);
    const [pathEditBarValue, setPathEditBarValue] = useState('');

    let fullDirPath = currentFolderPath?.getHierarchy() ?? [];

    if (currentFolderPath !== null) {
        const first = currentFolderPath.getDriveLetter() !== undefined ? currentFolderPath.getDriveLetter() + ':' : '/';
        fullDirPath = [first].concat(fullDirPath);
    }

    const lastPathItemChild = (
        <div style={{
            display: 'flex',
            marginLeft: 6,
        }}>
            <OperationIcon id={operationIconIds.path.copy} isMini={true} onClick={onClickPathCopyIcon} />
            <OperationIcon id={operationIconIds.path.edit} isMini={true} onClick={onClickPathEditIcon} />
        </div>
    );

    const pathEditBarRef = createRef<HTMLInputElement>();

    useEffect(() => {
        pathEditBarRef.current?.focus();
    });

    useEffect(() => {
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [onKeyDown]);

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
                    <input
                        className="operation-bar-path-edit"
                        id="pathEditBar"
                        style={styles.operationBarPathEdit}
                        onChange={(e) => setPathEditBarValue(e.target.value)}
                        value={pathEditBarValue}
                        ref={pathEditBarRef}
                    />
                    <div className="operation-bar-path" style={styles.operationBarPath}>
                        {
                            fullDirPath.map((eachPath, index) => (
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
                                    {index === fullDirPath.length - 1 && lastPathItemChild}
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>
            <div className="operation-bar-row">
                <div className="operation-bar-row-items">
                    <OperationIcon id={operationIconIds.item.copy} onClick={() => {
                        iterateSelectedPaths((path) => {
                            Fs.duplicate(path).catch(console.error);
                        });
                    }} />
                </div>
            </div>
        </div>
    );

    function iterateSelectedPaths(callback: (path: ItemPath, index: number) => void) {
        selectedItemPaths.forEach(callback);
    }

    function onClickPathCopyIcon() {
        const currentPath = store.getState().currentFolderPath;

        if (currentPath !== null) {
            navigator.clipboard.writeText(currentPath.getFullPath()).catch(console.error);

            dispatch(slices.popups.actions.add({
                uuid: generateUuid(),
                data: {
                    title: '操作ペイン',
                    description: '作業フォルダのパスをコピーしました。',
                },
            }));
        } else {
            console.error('Failed to copy the current path to the clipboard.');
        }
    }

    function onClickPathEditIcon() {
        setShowPathEditBar(true);

        if (currentFolderPath !== null) {
            setPathEditBarValue(currentFolderPath.getFullPath());
        }
    }

    function onKeyDown(event: KeyboardEvent) {
        const target = event.target as HTMLElement;

        if (target.id === pathEditBarRef.current?.id && showPathEditBar && event.key === 'Enter') {
            confirmWorkingFolderPathOnEditBar();
        }
    }

    function confirmWorkingFolderPathOnEditBar() {
        setShowPathEditBar(false);

        const path = ItemPath.from(pathEditBarValue, true);

        Fs.getStats(path)
            .then((stats) => {
                if (stats.kind === ItemKind.Folder) {
                    dispatch(slices.currentFolderPath.actions.update(path));
                } else {
                    dispatch(slices.popups.actions.add({
                        uuid: generateUuid(),
                        data: {
                            title: 'エラー',
                            description: 'フォルダパスを指定してください。',
                        },
                    }));
                }
            })
            .catch((e) => {
                if (e.message === FsErrorKind.NotExists) {
                    dispatch(slices.popups.actions.add({
                        uuid: generateUuid(),
                        data: {
                            title: 'エラー',
                            description: '指定されたパスが見つかりません。',
                        },
                    }));
                } else {
                    console.error(e);
                }
            });
    }
}
