import { Dirent } from "fs";
import { FileItem, FileItemIdentifier, FileItemStats, FolderItem, FolderItemStats, Item, ItemKind, ItemPath, ItemStats } from "./item";

export enum FsErrorKind {
    NoSuchFileOrDirectory = 'no such file or directory',
    NotADirectory = 'not a directory',
    NotAFile = 'not a file',
    CannotReadItemStats = 'cannot read item stats',
    CannotDuplicateRootFolder = 'cannot duplicate root folder',
}

export const fsEncoding = 'utf-8';
export const duplicateItemSuffix = '_copy';

export interface IFs {
    getStats(path: ItemPath): ItemStats;

    getChildren(path: ItemPath): Promise<Item[]>;

    duplicate(path: ItemPath): Promise<void>;

    watch(path: ItemPath, callback: () => void): void;
}

export default class Fs {
    private static isProdEnv: boolean = process.env.NODE_ENV === 'production';

    private static fs(): IFs {
        return Fs.isProdEnv ? new NativeFs() : new FakeFs();
    }

    public static getStats(path: ItemPath): ItemStats {
        return Fs.fs().getStats(path);
    }

    public static getChildren(path: ItemPath): Promise<Item[]> {
        return Fs.fs().getChildren(path);
    }

    public static duplicate(path: ItemPath): Promise<void> {
        return Fs.fs().duplicate(path);
    }

    public static watch(path: ItemPath, callback: () => void) {
        return Fs.fs().watch(path, callback);
    }
};

export class NativeFs implements IFs {
    private static fs(): any {
        return process.env.NODE_ENV === 'test' ? require('fs') : window.require('fs');
    }

    private static fsPromises(): any {
        return this.fs().promises;
    }

    public getStats(path: ItemPath): ItemStats {
        let stats: any;

        try {
            stats = NativeFs.fs().statSync(path.getFullPath());
        } catch (e) {
            throw FsErrorKind.CannotReadItemStats;
        }

        return stats.isFile() ? {
            kind: ItemKind.File,
            size: stats.size !== 0 ? stats.size : undefined,
            created: new Date(stats.birthtimeMs),
            lastAccessed: new Date(stats.atimeMs),
            lastModified: new Date(stats.mtimeMs),
        } : {
            kind: ItemKind.Folder,
            created: new Date(stats.birthtimeMs),
            lastAccessed: new Date(stats.atimeMs),
            lastModified: new Date(stats.mtimeMs),
        };
    }

    public getChildren(path: ItemPath): Promise<Item[]> {
        return new Promise((resolve) => NativeFs.fsPromises().readdir(path.getFullPath(), {
            encoding: fsEncoding,
            withFileTypes: true,
        })
            .then((dirents: Dirent[]) => {
                const children: Item[] = [];

                dirents.forEach((eachDirent) => {
                    const isFolder = eachDirent.isDirectory();
                    const absPath = path.append(eachDirent.name, isFolder);
                    const stats = this.getStats(absPath);

                    const childItem = !isFolder ? {
                        kind: ItemKind.File,
                        path: path.append(FileItemIdentifier.from(eachDirent.name), isFolder),
                        stats: stats as FileItemStats,
                    } as FileItem : {
                        kind: ItemKind.Folder,
                        path: path.append(eachDirent.name, isFolder),
                        stats: stats as FolderItemStats,
                    } as FolderItem;

                    children.push(new Item(childItem));
                });

                resolve(children);
            }));
    }

    public duplicate(path: ItemPath): Promise<void> {
        return new Promise((resolve) => {
            alert('unimplemented');
            resolve();
        });
    }

    public watch(path: ItemPath, callback: () => void) {
        alert('unimplemented');
    }
}

export type FakeFileItem = FileItem;

export type FakeFolderItem = FolderItem & {
    children: {
        id: string,
        isFolder: boolean,
    }[],
};

export type FakeItem = FakeFileItem | FakeFolderItem;

export class FakeFs implements IFs {
    private static items: {
        [index: string]: FakeItem,
    } = {
        '/': {
            kind: ItemKind.Folder,
            path: new ItemPath(undefined, [], true),
            stats: {
                kind: ItemKind.Folder,
                created: new Date(),
                lastAccessed: new Date(),
                lastModified: new Date(),
            },
            children: [
                {
                    id: 'desktop.ini',
                    isFolder: false,
                },
                {
                    id: 'usr',
                    isFolder: true,
                },
            ],
        },
        '/desktop.ini': {
            kind: ItemKind.File,
            path: new ItemPath(undefined, ['desktop.ini'], false),
            stats: {
                kind: ItemKind.File,
                size: 1024,
                created: new Date(),
                lastAccessed: new Date(),
                lastModified: new Date(),
            },
        },
        '/usr/': {
            kind: ItemKind.Folder,
            path: new ItemPath(undefined, ['usr'], true),
            stats: {
                kind: ItemKind.Folder,
                created: new Date(),
                lastAccessed: new Date(),
                lastModified: new Date(),
            },
            children: [
                {
                    id: 'desktop.ini',
                    isFolder: false,
                },
                {
                    id: 'win32.sys',
                    isFolder: false,
                },
            ],
        },
        '/usr/desktop.ini': {
            kind: ItemKind.File,
            path: new ItemPath(undefined, ['usr', 'main.rs'], false),
            stats: {
                kind: ItemKind.File,
                size: 1024,
                created: new Date(),
                lastAccessed: new Date(),
                lastModified: new Date(),
            },
        },
        '/usr/win32.sys': {
            kind: ItemKind.File,
            path: new ItemPath(undefined, ['usr', 'win32.sys'], false),
            stats: {
                kind: ItemKind.File,
                size: 1024,
                created: new Date(),
                lastAccessed: new Date(),
                lastModified: new Date(),
            },
        },
    };

    private static watcherPath: ItemPath;
    private static watcherCallback: () => void;

    public static getItem(path: ItemPath): FakeItem | undefined {
        return FakeFs.items[path.getFullPath()];
    }

    public getStats(path: ItemPath): ItemStats {
        const target = FakeFs.getItem(path);

        if (target === undefined) {
            throw FsErrorKind.NoSuchFileOrDirectory;
        }

        return target.stats;
    }

    public getChildren(path: ItemPath): Promise<Item[]> {
        return new Promise((resolve) => {
            const target = FakeFs.getItem(path);

            if (target === undefined) {
                throw FsErrorKind.NoSuchFileOrDirectory;
            }

            if (target.kind !== ItemKind.Folder) {
                throw FsErrorKind.NotADirectory;
            }

            const children = (target as FakeFolderItem).children.map((eachChild) => {
                const absPath = path.append(eachChild.id, eachChild.isFolder);
                return new Item(FakeFs.getItem(absPath)!);
            });

            resolve(children);
        });
    }

    public duplicate(path: ItemPath): Promise<void> {
        return new Promise((resolve) => {
            if (path.isRoot()) {
                throw FsErrorKind.CannotDuplicateRootFolder;
            }

            const isOriginalFolder = path.isFolder();
            const originalStats = this.getStats(path);

            if (originalStats === undefined) {
                throw FsErrorKind.CannotReadItemStats;
            }

            const stats: ItemStats = isOriginalFolder ? {
                kind: originalStats.kind,
                created: new Date(),
                lastAccessed: new Date(),
                lastModified: new Date(),
            } : {
                kind: originalStats.kind,
                size: (originalStats as FileItemStats).size,
                created: new Date(),
                lastAccessed: new Date(),
                lastModified: new Date(),
            };

            const originalParent = path.getParent();
            const parentChildren = (FakeFs.items[originalParent.getFullPath()] as FakeFolderItem).children;
            let targetId = path.getIdentifier().toString() + duplicateItemSuffix;

            while (parentChildren.some((v) => v.id === targetId)) {
                targetId += duplicateItemSuffix;
            }

            const targetPath = originalParent.append(targetId, isOriginalFolder);
            const targetFullPath = targetPath.getFullPath();
            const target: FakeItem = isOriginalFolder ? {
                kind: ItemKind.Folder,
                path: targetPath,
                stats: stats,
                // fix
                children: [],
            } : {
                kind: ItemKind.File,
                path: targetPath,
                stats: stats,
            };

            parentChildren.push({
                id: targetId,
                isFolder: isOriginalFolder,
            });
            FakeFs.items[targetFullPath] = target;
            this.dispatchWatcher(originalParent);
            resolve();
        });
    }

    private dispatchWatcher(parentPath: ItemPath) {
        if (FakeFs.watcherPath.isEqual(parentPath)) {
            FakeFs.watcherCallback();
        }
    }

    public watch(path: ItemPath, callback: () => void) {
        FakeFs.watcherPath = path;
        FakeFs.watcherCallback = callback;
    }
}
