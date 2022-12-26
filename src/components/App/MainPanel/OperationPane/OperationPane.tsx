import { generateUuid } from '../../../../common/utils';
import './OperationPane.css';
import OperationIcon from './OperationIcon/OperationIcon';
import { useDispatch, useSelector } from 'react-redux/es/exports';
import { RootState, slices, store } from '../../../../common/redux';
import { variables as leftPanelVariables } from '../../LeftPane/LeftPane';
import Fs, { CompressionFormat, FsErrorKind } from '../../../../common/fs/fs';
import { ItemPath } from '../../../../common/fs/path';
import { createRef, useEffect, useState } from 'react';
import { ItemKind } from '../../../../common/fs/item';
import { renameBarClassName } from '../ContentPane/ContentItem/ContentItem';
import Dropdown, { DropdownRef } from '../../../common/Dropdown/Dropdown';
import { DropdownItemData } from '../../../common/Dropdown/DropdownItem/DropdownItem';
import { Popup } from '../../../../common/popup';
import { EventHandlerLayer, events, PropagationStopper } from '../../../../common/event';

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
        rename: 'rename',
        copy: 'copy',
        trash: 'trash',
        compress: 'compress',
        extract: 'extract',
    },
};

export const variables = {
    height: (30 * 2) + (3 * 3),
};

export default function OperationPane() {
    const dispatch = useDispatch();

    const tab = useSelector((state: RootState) => state.tab);
    const selectedItemPaths = useSelector((state: RootState) => state.selectedItemPaths);
    const isExtractable = selectedItemPaths.length > 0 && !selectedItemPaths.some((v) => !v.isExtractable());
    const preventIconClick = selectedItemPaths.length === 0;
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
    const compressionDropdownRef = createRef<DropdownRef>();
    const pathEditBarRef = createRef<HTMLInputElement>();

    useEffect(() => {
        pathEditBarRef.current?.focus();
    });

    useEffect(() => {
        events.keyDown.addHandler(onKeyDown, EventHandlerLayer.KeyDownLayer.OperationPane);
        events.mouseDown.addHandler(onMouseDown);

        return () => {
            events.keyDown.removeHandler(onKeyDown, EventHandlerLayer.KeyDownLayer.OperationPane);
            events.mouseDown.removeHandler(onMouseDown);
        };
    }, [onKeyDown, onMouseDown]);

    const renderers = {
        dropdowns: () => {
            const newFolderDropdown: DropdownItemData[] = [
                {
                    id: 'folder',
                    inputField: true,
                    onConfirm: (_id, v) => createItem(v, true),
                },
            ];

            const newFileDropdown: DropdownItemData[] = [
                {
                    id: 'file',
                    inputField: true,
                    onConfirm: (_id, v) => createItem(v, false),
                },
            ];

            const onConfirmCompressionDropdownItem = (id: string) => compressItem(id as CompressionFormat, selectedItemPaths);

            // fix
            const compressionDropdown: DropdownItemData[] = [
                {
                    id: CompressionFormat.Zip,
                    value: 'ZIP',
                    onConfirm: onConfirmCompressionDropdownItem,
                },
                {
                    id: CompressionFormat.SZip,
                    value: '7Z',
                    onConfirm: onConfirmCompressionDropdownItem,
                },
                {
                    id: CompressionFormat.Rar,
                    value: 'RAR',
                    onConfirm: onConfirmCompressionDropdownItem,
                },
            ];

            return (
                <>
                <Dropdown pivot={[155, 95]} items={newFolderDropdown} ref={newFolderDropdownRef} />
                <Dropdown pivot={[185, 95]} items={newFileDropdown} ref={newFileDropdownRef} />
                {!preventIconClick && <Dropdown pivot={[275, 95]} items={compressionDropdown} ref={compressionDropdownRef} />}
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
                            id={operationIconIds.item.rename}
                            preventClick={preventIconClick}
                            onClick={() => {
                                if (selectedItemPaths.length !== 0) {
                                    dispatch(slices.renamingItemPath.actions.update(selectedItemPaths[0]));
                                }
                            }}
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
                        <OperationIcon
                            id={operationIconIds.item.compress}
                            preventClick={preventIconClick}
                            onClick={() => compressionDropdownRef.current?.switchVisibility()}
                        />
                        <OperationIcon
                            id={operationIconIds.item.extract}
                            preventClick={!isExtractable}
                            onClick={() => {
                                if (isExtractable) {
                                    iterateSelectedPaths(extractFile, '圧縮ファイルを選択してください。');
                                }
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

    function iterateSelectedPaths(
        callback?: (path: ItemPath, index: number) => void,
        popupDescriptionOnNotSelected: string = 'アイテムを選択してください。',
    ) {
        if (selectedItemPaths.length === 0) {
            dispatch(slices.popups.actions.add({
                title: '操作ペイン',
                description: popupDescriptionOnNotSelected,
                timeout: Popup.defaultClosingTimeout,
            }));

            return;
        }

        if (callback !== undefined) {
            selectedItemPaths.forEach(callback);
        }
    }

    function onItemProcedureProgress(popupId: string, popupTitle: string): (progress: number) => void {
        let hasFinishedPreparation = false;

        return (progress) => {
            if (!hasFinishedPreparation) {
                dispatch(slices.popups.actions.change({
                    id: popupId,
                    callback: (v) => {
                        v.description = '処理中';
                        return v;
                    },
                }));
            }

            hasFinishedPreparation = true;

            dispatch(slices.popups.actions.change({
                id: popupId,
                callback: (v) => {
                    v.progress = progress
                    return v;
                },
            }));

            if (progress === 100) {
                if (Popup.isOpen(popupId)) {
                    dispatch(slices.popups.actions.change({
                        id: popupId,
                        callback: (v) => {
                            v.description = '処理が完了しました。';
                            return v;
                        },
                    }));
                } else {
                    dispatch(slices.popups.actions.add({
                        id: popupId,
                        title: popupTitle,
                        description: '処理が完了しました。',
                    }));
                }

                setTimeout(() => {
                    Popup.close(popupId);
                }, Popup.defaultClosingTimeout);
            }
        };
    }

    function compressItem(format: CompressionFormat, paths: ItemPath[]) {
        const popupId = generateUuid();
        const popupTitle = 'ファイル圧縮';

        dispatch(slices.popups.actions.add({
            id: popupId,
            title: popupTitle,
            description: '準備中...',
            progress: 0,
        }));

        Fs.compress(format, paths, onItemProcedureProgress(popupId, popupTitle));
    }

    function extractFile(path: ItemPath) {
        const popupId = generateUuid();
        const popupTitle = 'ファイル解凍';

        dispatch(slices.popups.actions.add({
            id: popupId,
            title: popupTitle,
            description: '準備中...',
            progress: 0,
        }));

        Fs.extract(path, onItemProcedureProgress(popupId, popupTitle));
    }

    function onClickPathCopyIcon() {
        const workingFolderPath = store.getState().tab.selected?.path;

        if (workingFolderPath !== undefined) {
            navigator.clipboard.writeText(workingFolderPath.getFullPath()).catch(console.error);

            dispatch(slices.popups.actions.add({
                title: '操作ペイン',
                description: '作業フォルダのパスをコピーしました。',
                timeout: Popup.defaultClosingTimeout,
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
                    timeout: Popup.defaultClosingTimeout,
                } : {
                    title: '新規ファイル',
                    description: 'ファイルが作成されました。',
                    timeout: Popup.defaultClosingTimeout,
                };

                dispatch(slices.popups.actions.add(payload));
            })
            .catch((error: any) => {
                let description;

                switch (error.message) {
                    case FsErrorKind.AlreadyExists:
                    description = 'すでに同じ名前のアイテムが存在します。';
                    break;

                    default:
                    console.error(error);
                    description = '不明なエラーが発生しました。';
                    break;
                }

                dispatch(slices.popups.actions.add({
                    title: '新規アイテム',
                    description: description,
                    timeout: Popup.defaultClosingTimeout,
                }));
            });
    }

    function onKeyDown(event: KeyboardEvent, stopPropagation: PropagationStopper) {
        const target = event.target as HTMLElement;

        if (event.ctrlKey && event.shiftKey && event.code === 'KeyV') {
            // rm
            event.preventDefault();
            stopPropagation();

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
                            timeout: Popup.defaultClosingTimeout,
                        }));

                        return;
                    }

                    Fs.getStats(path)
                        .then((stats) => {
                            if (stats.kind !== ItemKind.Folder) {
                                dispatch(slices.popups.actions.add({
                                    title: 'FileMe',
                                    description: 'ペーストされたパスはフォルダではありません。',
                                    timeout: Popup.defaultClosingTimeout,
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
            stopPropagation();
            dispatch(slices.renamingItemPath.actions.update(selectedItemPaths[0]));
            return;
        }

        // End item renaming.
        if (target.className === renameBarClassName && renamingItemPath !== null) {
            switch (event.code) {
                case 'Enter':
                stopPropagation();
                confirmRenaming((target as HTMLInputElement).value);
                return;

                case 'Escape':
                stopPropagation();
                confirmRenaming();
                return;
            }
        }

        // Close path edit bar.
        if (target.id === pathEditBarRef.current?.id && showPathEditBar) {
            switch (event.code) {
                case 'Enter':
                stopPropagation();
                confirmWorkingFolderPathOnEditBar();
                return;

                case 'Escape':
                stopPropagation();
                confirmWorkingFolderPathOnEditBar(false);
                break;
            }
        }
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
                        timeout: Popup.defaultClosingTimeout,
                    }));
                }
            })
            .catch((e) => {
                if (e.message === FsErrorKind.NotExists) {
                    dispatch(slices.popups.actions.add({
                        title: 'エラー',
                        description: '指定されたパスが見つかりません。',
                        timeout: Popup.defaultClosingTimeout,
                    }));
                } else {
                    console.error(e);
                }
            });
    }
}
