import { preferences } from '../../../../common/preferences';
import { generateUuid } from '../../../../common/utils';
import './OperationPane.css';
import OperationIcon from './OperationIcon/OperationIcon';
import { useDispatch, useSelector } from 'react-redux/es/exports';
import { RootState, slices, store } from '../../../../common/redux';
import { variables as leftPanelVariables } from '../../LeftPanel/LeftPanel';
import Fs, { FsErrorKind } from '../../../../common/fs/fs';
import { ItemPath } from '../../../../common/fs/path';
import { createRef, useEffect, useState } from 'react';
import { ItemKind } from '../../../../common/fs/item';
import { renameBarClassName } from '../ContentPane/ContentItem/ContentItem';
import Dropdown, { DropdownRef } from '../../../common/Dropdown/Dropdown';
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

export default function OperationPane() {
    const dispatch = useDispatch();

    const tab = useSelector((state: RootState) => state.tab);
    const selectedItemPaths = useSelector((state: RootState) => state.selectedItemPaths);
    const renamingItemPath = useSelector((state: RootState) => state.renamingItemPath);
    const showPathEditBar = useSelector((state: RootState) => state.showPathEditBar);
    const [pathEditBarValue, setPathEditBarValue] = useState('');

    const workingFolderPath = tab.selected?.path;
    let fullDirPath = workingFolderPath?.getHierarchy() ?? [];

    if (workingFolderPath !== undefined) {
        const first = workingFolderPath.getDriveLetter() !== undefined ? workingFolderPath.getDriveLetter() + ':' : '/';
        fullDirPath = [first].concat(fullDirPath);
    }

    const newFolderDropdownRef = createRef<DropdownRef>();
    const newFileDropdownRef = createRef<DropdownRef>();
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

    const renderers = {
        dropdowns: () => {
            const newFolderDropdown: DropdownItemData[] = [
                {
                    id: 'folder',
                    inputField: true,
                    onConfirm: (v) => createItem(v, true),
                },
            ];

            const newFileDropdown: DropdownItemData[] = [
                {
                    id: 'file',
                    inputField: true,
                    onConfirm: (v) => createItem(v, false),
                },
            ];

            return (
                <>
                <Dropdown pivot={[155, 95]} items={newFolderDropdown} ref={newFolderDropdownRef} />
                <Dropdown pivot={[185, 95]} items={newFileDropdown} ref={newFileDropdownRef} />
                </>
            );
        },
        rows: () => {
            const lastPathItemChild = (
                <div style={{
                    display: 'flex',
                    marginLeft: 6,
                }}>
                    <OperationIcon id={operationIconIds.path.copy} mini={true} onClick={onClickPathCopyIcon} />
                    <OperationIcon id={operationIconIds.path.edit} mini={true} onClick={onClickPathEditIcon} />
                </div>
            );

            const preventIconClick = selectedItemPaths.length === 0;

            const rowItems = {
                window: (
                    <div className="operation-pane-row-items">
                        <OperationIcon id={operationIconIds.window.prev} />
                        <OperationIcon id={operationIconIds.window.next} />
                        <OperationIcon id={operationIconIds.window.reload} onClick={() => {
                            if (workingFolderPath !== undefined) {
                                Fs.getChildren(workingFolderPath)
                                    .then((items) => dispatch(slices.currentFolderChildren.actions.update(items)))
                                    .catch(console.error);
                            }
                        }} />
                    </div>
                ),
                path: (
                    <div className="operation-pane-row-items" style={{
                        // fix
                        width: `calc(100vw - ${leftPanelVariables.width + (90 + (3 * 2)) + (3 * 2)}px)`,
                    }}>
                        <input
                            className="operation-pane-path-edit"
                            id="pathEditBar"
                            style={styles.pathEditBar}
                            onChange={(e) => setPathEditBarValue(e.target.value)}
                            value={pathEditBarValue}
                            ref={pathEditBarRef}
                        />
                        <div className="operation-pane-path" style={styles.pathBar}>
                            {
                                fullDirPath.map((eachPath, index) => (
                                    <div
                                        className="operation-pane-path-item"
                                        onClick={() => {
                                            const parent = workingFolderPath?.getParent(fullDirPath.length - index - 1);

                                            if (parent !== undefined) {
                                                dispatch(slices.tab.actions.changePath(parent));
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
                    <div className="operation-pane-row-items">
                        <OperationIcon
                            id={operationIconIds.item.create}
                            preventClick={false}
                            onClick={() => newFolderDropdownRef.current?.switchVisibility()}
                        />
                        <OperationIcon
                            id={operationIconIds.item.create}
                            preventClick={false}
                            onClick={() => newFileDropdownRef.current?.switchVisibility()}
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
                <>
                <div className="operation-pane-row">
                    {rowItems.window}
                    {rowItems.path}
                </div>
                <div className="operation-pane-row">
                    {rowItems.operation}
                </div>
                </>
            );
        },
    };

    const styles = {
        container: {
            backgroundColor: preferences.appearance.background.panel1,
            height: `${variables.height}px`,
        },
        pathBar: {
            display: showPathEditBar ? 'none' : 'flex',
        },
        pathEditBar: {
            display: showPathEditBar ? 'block' : 'none',
        },
    };

    const dropdowns = renderers.dropdowns();
    const rows = renderers.rows();

    return (
        <div className="operation-pane-container" style={styles.container}>
            {dropdowns}
            {rows}
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
        const workingFolderPath = store.getState().tab.selected?.path;

        if (workingFolderPath !== undefined) {
            navigator.clipboard.writeText(workingFolderPath.getFullPath()).catch(console.error);

            dispatch(slices.popups.actions.add({
                title: '操作ペイン',
                description: '作業フォルダのパスをコピーしました。',
            }));
        } else {
            console.error('Failed to copy the working folder path to the clipboard due to it being null.');
        }
    }

    function onClickPathEditIcon() {
        dispatch(slices.showPathEditBar.actions.update(true));

        if (workingFolderPath !== undefined) {
            setPathEditBarValue(workingFolderPath.getFullPath());
        }
    }

    function createItem(name: string, isFolder: boolean) {
        if (workingFolderPath === undefined) {
            return;
        }

        if (name.replaceAll(' ', '').length === 0) {
            return;
        }

        let path: ItemPath;

        try {
            path = workingFolderPath.append(name, isFolder);
        } catch (e: any) {
            alert('unimplemented');
        }

        Fs.create(path!)
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
                    title: '新規アイテム',
                    description: description,
                }));
            });
    }

    function onKeyDown(event: KeyboardEvent) {
        const target = event.target as HTMLElement;

        if (event.ctrlKey && event.shiftKey && event.code === 'KeyV') {
            // rm
            event.preventDefault();

            navigator.clipboard.readText()
                .then((value) => {
                    const path = ItemPath.from(value, true);

                    if (!Fs.exists(path)) {
                        const valueLengthLimit = 80;
                        const trimmedValue = value.length > valueLengthLimit ?
                            value.substring(0, valueLengthLimit) + '...' :
                            value;

                        dispatch(slices.popups.actions.add({
                            title: 'FileMe',
                            // fix
                            description: 'ペーストされたパスは存在しません。(' + trimmedValue + ')',
                        }));

                        return;
                    }

                    Fs.getStats(path)
                        .then((stats) => {
                            if (stats.kind !== ItemKind.Folder) {
                                dispatch(slices.popups.actions.add({
                                    title: 'FileMe',
                                    description: 'ペーストされたパスはフォルダではありません。',
                                }));

                                return;
                            }

                            dispatch(slices.tab.actions.changePath(path));
                        })
                        .catch((e) => {
                            throw e;
                        });
                })
                .catch((e) => {
                    throw e;
                });
        }

        // Start item renaming.
        if (event.code === 'F2' && selectedItemPaths.length !== 0) {
            dispatch(slices.renamingItemPath.actions.update(selectedItemPaths[0]));
            return;
        }

        // End item renaming.
        if (target.className === renameBarClassName && renamingItemPath !== null) {
            switch (event.code) {
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
            switch (event.code) {
                case 'Enter':
                confirmWorkingFolderPathOnEditBar();
                return;

                case 'Escape':
                confirmWorkingFolderPathOnEditBar(false);
                break;
            }
        }

        // Run selected items.
        // fix
    }

    function onMouseDown(event: MouseEvent) {
        const target = event.target as HTMLElement;

        // Unselect all selected items.
        if (target.className === 'content-pane-container' && selectedItemPaths.length !== 0) {
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
            const newPath = renamingItemPath.getParent().append(newId, renamingItemPath.isFolder());
            Fs.rename(renamingItemPath, newPath);
        }

        dispatch(slices.renamingItemPath.actions.update(null));
    }

    function confirmWorkingFolderPathOnEditBar(update: boolean = true) {
        dispatch(slices.showPathEditBar.actions.update(false));

        if (!update) {
            return;
        }

        const path = ItemPath.from(pathEditBarValue, true);

        Fs.getStats(path)
            .then((stats) => {
                if (stats.kind === ItemKind.Folder) {
                    dispatch(slices.tab.actions.changePath(path));
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
