import { createRef, Fragment, useEffect, useRef, useState } from 'react';
import Fs, { FileContent } from '../../../../../common/fs/fs';
import { FileItemIdentifier, ItemPath } from '../../../../../common/fs/path';
import { preferences } from '../../../../../common/preferences';
import { store } from '../../../../../common/redux';
import { variables as tabBarVariables } from '../../TabPane/TabPane';
import './PreviewPopup.css';


export enum ItemPreviewContentKind {
    Folder,
    UnreadFile,
    FailedToRead,
    BinaryFile,
    TextFile,
    ImageFile,
}

export type ItemPreviewContent = {
    kind: ItemPreviewContentKind,
    path: ItemPath,
    content?: FileContent,
};

export default function PreviewPopup() {
    useEffect(() => {
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('mousemove', onMouseMove);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('mousemove', onMouseMove);
        };
    }, [onKeyDown]);

    const [hidden, setHidden] = useState(true);
    const draggingTop = useRef(false);
    const [containerPosition, setContainerPosition] = useState([200, tabBarVariables.height + 200]);
    const [content, setContent] = useState<ItemPreviewContent>();
    const latestSelectedItemPath = useRef<ItemPath>();

    useEffect(() => {
        store.subscribe(() => {
            const selectedItemPaths = store.getState().selectedItemPaths;
            const targetPath = selectedItemPaths.at(selectedItemPaths.length - 1);

            if (latestSelectedItemPath.current !== targetPath) {
                latestSelectedItemPath.current = targetPath;

                if (targetPath === undefined) {
                    setContent(undefined);
                    return;
                }

                if (targetPath.isFolder()) {
                    setContent({
                        kind: ItemPreviewContentKind.Folder,
                        path: targetPath,
                    });

                    return;
                }

                const fileId = targetPath.getIdentifier() as FileItemIdentifier;

                if (fileId.isImage()) {
                    setContent({
                        kind: ItemPreviewContentKind.ImageFile,
                        path: targetPath,
                    });

                    return;
                }

                setContent({
                    kind: ItemPreviewContentKind.UnreadFile,
                    path: targetPath,
                });
            }
        });
    }, []);

    useEffect(() => {
        if (!hidden && content?.kind === ItemPreviewContentKind.UnreadFile) {
            Fs.readFile(content.path)
                .then((fileContent) => {
                    const isBinary = fileContent.chunks.some((v) => v.includes('\u0000'));

                    setContent({
                        kind: isBinary ? ItemPreviewContentKind.BinaryFile : ItemPreviewContentKind.TextFile,
                        path: content.path,
                        content: fileContent,
                    });
                })
                .catch((e) => {
                    // unimplemented
                    console.error(e);

                    setContent({
                        kind: ItemPreviewContentKind.FailedToRead,
                        path: content.path,
                    });
                });
        }
    });

    const styles = {
        container: {
            display: !hidden && content !== undefined ? 'block' : 'none',
            left: containerPosition[0],
            top: containerPosition[1],
        },
        topIcon: {
            backgroundImage: `url('./lib/img/icons/${preferences.appearance.theme}/preview.svg')`,
        },
        close: {
            backgroundImage: `url('./lib/img/icons/${preferences.appearance.theme}/close.svg')`,
        },
        content: {
            folder: {
                backgroundImage: `url('./lib/img/icons/${preferences.appearance.theme}/folder.svg')`,
            },
            failedToRead: {
                backgroundImage: `url('./lib/img/icons/${preferences.appearance.theme}/close.svg')`,
            },
            binary: {
                backgroundImage: `url('./lib/img/icons/${preferences.appearance.theme}/binary.svg')`,
            },
        },
    };

    const renderers = {
        contentChild: () => {
            switch (content?.kind) {
                case ItemPreviewContentKind.Folder:
                return <div className="preview-popup-content-icon" style={styles.content.folder} />;

                case ItemPreviewContentKind.FailedToRead:
                return <div className="preview-popup-content-icon" style={styles.content.failedToRead} />;

                case ItemPreviewContentKind.BinaryFile:
                return <div className="preview-popup-content-icon" style={styles.content.binary} />;

                case ItemPreviewContentKind.TextFile:
                const text = content.content?.chunks.join().split('\n').map((v, i) => (
                    <Fragment key={i}>{v}<br /></Fragment>
                ));

                const omissionMessage = (
                    <div className="preview-popup-content-text-omission">
                        [...]
                    </div>
                );

                return (
                    <div className="preview-popup-content-text">
                        {text}
                        {content.content?.omitted === true ? omissionMessage : undefined}
                    </div>
                );

                case ItemPreviewContentKind.ImageFile:
                return (
                    <div className="preview-popup-content-image" style={{
                        backgroundImage: `url('${content.path.getFullPath()}')`,
                    }} />
                );

                default:
                return;
            }
        },
    };

    const popupRef = createRef<HTMLDivElement>();
    const contentChild = renderers.contentChild();

    return (
        <div className="preview-popup" style={styles.container} ref={popupRef}>
            <div className="preview-popup-top">
                <div className="preview-popup-top-left">
                    <div className="preview-popup-icon" style={styles.topIcon} />
                    <div className="preview-popup-title">
                        {content?.path.getIdentifier().toString()}
                    </div>
                </div>
                <div className="preview-popup-close" style={styles.close} onClick={() => setHidden(true)} />
            </div>
            <div className="preview-popup-content">
                {contentChild}
            </div>
        </div>
    );

    function onKeyDown(event: KeyboardEvent) {
        if (event.code === 'Space' && content !== undefined) {
            setHidden((state) => !state);
            // Prevent from scrolling of content pane by space key.
            event.preventDefault();
        }
    }

    function onMouseDown(event: MouseEvent) {
        const target = event.target as HTMLElement;

        if (target.closest('.preview-popup-top') && target.className !== 'preview-popup-close') {
            draggingTop.current = true;
        }
    }

    function onMouseUp() {
        if (draggingTop.current) {
            draggingTop.current = false;
        }
    }

    function onMouseMove(event: MouseEvent) {
        if (draggingTop.current) {
            setContainerPosition((state) => {
                const popupRect = popupRef.current?.getBoundingClientRect();

                if (popupRect === undefined) {
                    return state;
                }

                const startPosition = [0, tabBarVariables.height];

                const moveTo = [
                    state[0] + event.movementX,
                    state[1] + event.movementY,
                ];

                const popupEndPosition = [
                    moveTo[0] + popupRect.width,
                    moveTo[1] + popupRect.height,
                ];

                if (
                    (moveTo[0] <= startPosition[0] && event.movementX < 0) ||
                    (moveTo[1] <= startPosition[1] && event.movementY < 0) ||
                    (popupEndPosition[0] > document.body.offsetWidth && event.movementX > 0) ||
                    (popupEndPosition[1] > document.body.offsetHeight && event.movementY > 0)
                ) {
                    return state;
                }

                return moveTo;
            });
        }
    }
}
