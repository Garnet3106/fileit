import { preferences } from '../../../../common/preferences';
import { generateUuid } from '../../../../common/utils';
import './OperationBar.css';
import OperationIcon from './OperationIcon/OperationIcon';
import { useDispatch, useSelector } from 'react-redux/es/exports';
import { RootState, slices, store } from '../../../../common/redux';
import { variables as leftPanelVariables } from '../../LeftPanel/LeftPanel';
import Fs, { FsErrorKind } from '../../../../common/fs/fs';
import { FileItemIdentifier, ItemPath } from '../../../../common/fs/path';
import { createRef, useEffect, useState } from 'react';
import { ItemKind } from '../../../../common/fs/item';
import { renameBarClassName } from '../ContentPanel/ContentItem/ContentItem';
import Dropdown from '../../../common/Dropdown/Dropdown';
import { DropdownItemData } from '../../../common/Dropdown/DropdownItem/DropdownItem';

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
        create: 'create',
        copy: 'copy',
        trash: 'trash',
    },
};

export const variables = {
    height: (30 * 2) + (3 * 3),
};

export default function OperationBar() {
    // fix
    const [isNewFolderDropdownDisplayed, setIsNewFolderDropdownDisplayed] = useState(false);
    const [isNewFileDropdownDisplayed, setIsNewFileDropdownDisplayed] = useState(false);
    const [newFolderDropdownValue, setNewFolderDropdownValue] = useState('');
    const [newFileDropdownValue, setNewFileDropdownValue] = useState('');

    const newFolderDropdown: DropdownItemData[] = [
        {
            id: 'folder',
            value: <input
                className="operation-pane-input"
                type="text"
                value={newFolderDropdownValue}
                onChange={(e) => setNewFolderDropdownValue(e.target.value)}
            />,
        },
    ];

    const newFileDropdown: DropdownItemData[] = [
        {
            id: 'file',
            value: <input
                className="operation-pane-input"
                type="text"
                value={newFileDropdownValue}
                onChange={(e) => setNewFileDropdownValue(e.target.value)}
            />,
        },
    ];

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
    const renamingItemPath = useSelector((state: RootState) => state.renamingItemPath);
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
            <OperationIcon id={operationIconIds.path.copy} mini={true} onClick={onClickPathCopyIcon} />
            <OperationIcon id={operationIconIds.path.edit} mini={true} onClick={onClickPathEditIcon} />
        </div>
    );

    const pathEditBarRef = createRef<HTMLInputElement>();

    useEffect(() => {
        pathEditBarRef.current?.focus();
    });

    useEffect(() => {
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('mousedown', onMouseDown);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('mousedown', onMouseDown);
        };
    }, [onKeyDown]);

    const preventIconClick = selectedItemPaths.length === 0;

    const rowItems = {
        window: (
            <div className="operation-bar-row-items">
                <OperationIcon id={operationIconIds.window.prev} />
                <OperationIcon id={operationIconIds.window.next} />
                <OperationIcon id={operationIconIds.window.reload} onClick={() => {
                    if (currentFolderPath !== null) {
                        Fs.getChildren(currentFolderPath)
                            .then((items) => dispatch(slices.currentFolderChildren.actions.update(items)))
                            .catch(console.error);
                    }
                }} />
            </div>
        ),
        path: (
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
        ),
        operation: (
            <div className="operation-bar-row-items">
                <OperationIcon
                    id={operationIconIds.item.create}
                    preventClick={false}
                    onClick={() => setIsNewFolderDropdownDisplayed(!isNewFolderDropdownDisplayed)}
                />
                <OperationIcon
                    id={operationIconIds.item.create}
                    preventClick={false}
                    onClick={() => setIsNewFileDropdownDisplayed(!isNewFileDropdownDisplayed)}
                />
                <OperationIcon
                    id={operationIconIds.item.copy}
                    preventClick={preventIconClick}
                    onClick={() => {
                        iterateSelectedPaths((path) => Fs.duplicate(path).catch(console.error));
                    }}
                />
                <OperationIcon
                    id={operationIconIds.item.trash}
                    preventClick={preventIconClick}
                    onClick={() => {
                        iterateSelectedPaths((path) => Fs.trash(path));
                    }}
                />
            </div>
        ),
    };

    return (
        <div className="operation-bar-container" style={styles.container}>
            <Dropdown displayed={[isNewFolderDropdownDisplayed, setIsNewFolderDropdownDisplayed]} pivot={[155, 95]} items={newFolderDropdown} />
            <Dropdown displayed={[isNewFileDropdownDisplayed, setIsNewFileDropdownDisplayed]} pivot={[185, 95]} items={newFileDropdown} />
            <div className="operation-bar-row">
                {rowItems.window}
                {rowItems.path}
            </div>
            <div className="operation-bar-row">
                {rowItems.operation}
            </div>
        </div>
    );

    function iterateSelectedPaths(callback: (path: ItemPath, index: number) => void) {
        if (selectedItemPaths.length === 0) {
            dispatch(slices.popups.actions.add({
                title: '操作ペイン',
                description: 'アイテムを選択してください。',
            }));

            return;
        }

        selectedItemPaths.forEach(callback);
    }

    function onClickPathCopyIcon() {
        const currentPath = store.getState().currentFolderPath;

        if (currentPath !== null) {
            navigator.clipboard.writeText(currentPath.getFullPath()).catch(console.error);

            dispatch(slices.popups.actions.add({
                title: '操作ペイン',
                description: '作業フォルダのパスをコピーしました。',
            }));
        } else {
            console.error('Failed to copy the working folder path to the clipboard due to it being null.');
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

        if (event.key === 'Enter') {
            const createItem = (name: string, isFolder: boolean) => {
                const path = currentFolderPath?.append(name, isFolder);

                if (path === undefined) {
                    return;
                }

                Fs.create(path)
                    .then(() => {
                        const payload = isFolder ? {
                            title: '新規フォルダ',
                            description: 'フォルダが作成されました。',
                        } : {
                            title: '新規ファイル',
                            description: 'ファイルが作成されました。',
                        };

                        dispatch(slices.popups.actions.add(payload));
                    })
                    .catch((e: any) => {
                        let description;

                        switch (e.message) {
                            case FsErrorKind.AlreadyExists:
                            description = 'すでに同じ名前のアイテムが存在します。';
                            break;

                            default:
                            console.error(e);
                            description = '不明なエラーが発生しました。';
                            break;
                        }

                        dispatch(slices.popups.actions.add({
                            title: '新規フォルダ',
                            description: description,
                        }));
                    });
            }

            if (isNewFolderDropdownDisplayed) {
                if (newFolderDropdownValue.replaceAll(' ', '').length !== 0) {
                    createItem(newFolderDropdownValue, true);
                }

                setNewFolderDropdownValue('');
                setIsNewFolderDropdownDisplayed(false);
                return;
            }

            if (isNewFileDropdownDisplayed) {
                if (newFileDropdownValue.replaceAll(' ', '').length !== 0) {
                    createItem(newFileDropdownValue, false);
                }

                setNewFileDropdownValue('');
                setIsNewFileDropdownDisplayed(false);
                return;
            }
        }

        // Start item renaming.
        if (event.key === 'F2' && selectedItemPaths.length !== 0) {
            dispatch(slices.renamingItemPath.actions.update(selectedItemPaths[0]));
            return;
        }

        // End item renaming.
        if (target.className === renameBarClassName && renamingItemPath !== null) {
            switch (event.key) {
                case 'Enter':
                confirmRenaming((target as HTMLInputElement).value);
                return;

                case 'Escape':
                confirmRenaming();
                return;
            }
        }

        // Close path edit bar.
        if (target.id === pathEditBarRef.current?.id && showPathEditBar) {
            switch (event.key) {
                case 'Enter':
                // fix
                case 'Escape':
                confirmWorkingFolderPathOnEditBar();
                return;
            }
        }

        // Run selected items.
        // fix
    }

    function onMouseDown(event: MouseEvent) {
        const target = event.target as HTMLElement;

        // Unselect all selected items.
        if (target.className === 'content-panel-container' && selectedItemPaths.length !== 0) {
            dispatch(slices.selectedItemPaths.actions.update([]));
        }

        // Close path edit bar.
        if (target.id !== pathEditBarRef.current?.id && showPathEditBar) {
            confirmWorkingFolderPathOnEditBar();
        }

        // Close rename bar.
        if (target.className !== renameBarClassName && renamingItemPath !== null) {
            dispatch(slices.renamingItemPath.actions.update(null));
        }
    }

    function confirmRenaming(newId?: string) {
        if (renamingItemPath === null) {
            return;
        }

        if (newId !== undefined && newId.length !== 0) {
            const id = renamingItemPath.isFolder() ? newId : FileItemIdentifier.from(newId);
            const newPath = renamingItemPath.getParent().append(id, renamingItemPath.isFolder());
            Fs.rename(renamingItemPath, newPath);
        }

        dispatch(slices.renamingItemPath.actions.update(null));
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
                        title: 'エラー',
                        description: 'フォルダパスを指定してください。',
                    }));
                }
            })
            .catch((e) => {
                if (e.message === FsErrorKind.NotExists) {
                    dispatch(slices.popups.actions.add({
                        title: 'エラー',
                        description: '指定されたパスが見つかりません。',
                    }));
                } else {
                    console.error(e);
                }
            });
    }
}
