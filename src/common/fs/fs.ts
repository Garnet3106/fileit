import { Dirent } from "fs";
import { ipcMessageSender } from "../ipc";
import { FileItem, FileItemStats, FolderItem, FolderItemStats, Item, ItemKind, ItemStats } from "./item";
import { FileItemIdentifier, ItemPath } from "./path";

export enum FsErrorKind {
    NotExists = 'Item not exists.',
    AlreadyExists = 'Item already exists.',
    NotADirectory = 'Item is not a directory.',
    NotAFile = 'Item is not a file.',
    BusyOrLocked = 'Item is busy or locked.',
    CannotDuplicateTheRootFolder = 'Cannot duplicate the root folder.',
    OperationNotPermitted = 'Operation not permitted.',
}

export namespace FsErrorKind {
    const messagePairs: [string, FsErrorKind][] = [
        ['EBUSY:', FsErrorKind.BusyOrLocked],
        ['EEXIST:', FsErrorKind.AlreadyExists],
        ['ENOENT:', FsErrorKind.NotExists],
        ['EPERM:', FsErrorKind.OperationNotPermitted],
    ];

    export function from(message?: string): FsErrorKind | undefined {
        if (message === undefined) {
            return undefined;
        }

        let kind: FsErrorKind | undefined = undefined;

        messagePairs.some(([startsWith, eachKind]) => {
            const matches = message.startsWith(startsWith);

            if (matches) {
                kind = eachKind;
            }

            return matches;
        });

        return kind;
    }
}

export class FsError extends Error {
    public path?: ItemPath;

    public constructor(kind: FsErrorKind, path?: ItemPath) {
        super();
        this.name = '';
        this.message = kind;
        this.path = path;
    }

    public static from(error: any, path?: ItemPath): Error {
        const kind = FsErrorKind.from(error.message);
        return kind !== undefined ? new FsError(kind, path) : error;
    }
}

export const fsEncoding = 'utf-8';

export interface IFs {
    exists(path: ItemPath): boolean;

    getStats(path: ItemPath): Promise<ItemStats>;

    getChildren(path: ItemPath): Promise<Item[]>;

    create(path: ItemPath): Promise<void>;

    duplicate(path: ItemPath): Promise<void>;

    rename(from: ItemPath, to: ItemPath): Promise<void>,

    trash(path: ItemPath): void;

    watch(path: ItemPath, callback: () => void): void;
}

export default class Fs {
    private static fs(): IFs {
        return process.env.NODE_ENV !== 'development' ? new NativeFs() : new FakeFs();
    }

    public static getDuplicatePath(path: ItemPath): ItemPath {
        do {
            path = path.duplicate();
        } while (Fs.exists(path));

        return path;
    }

    public static exists(path: ItemPath): boolean {
        return Fs.fs().exists(path);
    }

    public static getStats(path: ItemPath): Promise<ItemStats> {
        return Fs.fs().getStats(path);
    }

    public static getChildren(path: ItemPath): Promise<Item[]> {
        return Fs.fs().getChildren(path);
    }

    public static create(path: ItemPath): Promise<void> {
        return Fs.fs().create(path);
    }

    public static duplicate(path: ItemPath): Promise<void> {
        return Fs.fs().duplicate(path);
    }

    public static rename(from: ItemPath, to: ItemPath): Promise<void> {
        return Fs.fs().rename(from, to);
    }

    public static trash(path: ItemPath) {
        Fs.fs().trash(path);
    }

    public static watch(path: ItemPath, callback: () => void) {
        return Fs.fs().watch(path, callback);
    }
};

export class NativeFs implements IFs {
    private static watcher: any = undefined;

    private static fsSync(): any {
        return process.env.NODE_ENV === 'test' ? require('fs') : window.require('fs');
    }

    private static fsPromises(): any {
        return this.fsSync().promises;
    }

    public exists(path: ItemPath): boolean {
        const exists = NativeFs.fsSync().existsSync;
        const fileExists = exists(new ItemPath(path.getDriveLetter(), path.getHierarchy(), false).getFullPath());
        const folderExists = exists(new ItemPath(path.getDriveLetter(), path.getHierarchy(), true).getFullPath());
        return fileExists || folderExists;
    }

    public getStats(path: ItemPath): Promise<ItemStats> {
        return new Promise((resolve, reject) => {
            NativeFs.fsPromises().stat(path.getFullPath())
                .then((stats: any) => {
                    const result = stats.isFile() ? {
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

                    resolve(result);
                })
                .catch((e: any) => reject(FsError.from(e, path)));
        });
    }

    public getChildren(path: ItemPath): Promise<Item[]> {
        return new Promise((resolve, reject) => {
            const options = {
                encoding: fsEncoding,
                withFileTypes: true,
            };

            NativeFs.fsPromises().readdir(path.getFullPath(), options)
                .then((dirents: Dirent[]) => {
                    const children: Item[] = [];

                    const promises: Promise<void>[] = dirents.map((eachDirent) => new Promise(async (resolve) => {
                        const isFolder = eachDirent.isDirectory();
                        const childPath = path.append(eachDirent.name, isFolder);
                        const stats = await this.getStats(childPath).catch(() => null);

                        if (stats === null) {
                            console.error('An item ignored.');
                            resolve();
                            return;
                        }

                        const childItem = !isFolder ? {
                            kind: ItemKind.File,
                            path: childPath,
                            stats: stats as FileItemStats,
                        } as FileItem : {
                            kind: ItemKind.Folder,
                            path: childPath,
                            stats: stats as FolderItemStats,
                        } as FolderItem;

                        children.push(new Item(childItem));
                        resolve();
                    }));

                    Promise.all(promises).then(() => resolve(children));
                })
                .catch((e: any) => reject(FsError.from(e, path)));
        });
    }

    public create(path: ItemPath): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.exists(path)) {
                reject(new FsError(FsErrorKind.AlreadyExists));
                return;
            }

            if (window.confirm(path.getFullPath())) {
                if (path.isFolder()) {
                    NativeFs.fsPromises().mkdir(path.getFullPath())
                        .then(resolve)
                        .catch((e: any) => reject(FsError.from(e, path)));
                } else {
                    NativeFs.fsPromises().writeFile(path.getFullPath(), '')
                        .then(resolve)
                        .catch((e: any) => reject(FsError.from(e, path)));
                }
            } else {
                resolve();
            }
        });
    }

    public duplicate(path: ItemPath): Promise<void> {
        return new Promise(async (resolve, reject) => {
            if (path.isRoot()) {
                reject(new FsError(FsErrorKind.CannotDuplicateTheRootFolder, path));
                return;
            }

            const targetPath = Fs.getDuplicatePath(path);
            const fsConstants = NativeFs.fsSync().constants;
            const fsPromises = NativeFs.fsPromises();

            if (!path.isFolder()) {
                // fix
                if (window.confirm(targetPath.getFullPath())) {
                    fsPromises.copyFile(path.getFullPath(), targetPath.getFullPath(), fsConstants.COPYFILE_EXCL).then(resolve);
                }
            } else {
                alert('unimplemented');
                resolve();
            }
        });
    }

    public rename(from: ItemPath, to: ItemPath): Promise<void> {
        return new Promise((resolve, reject) => {
            // fix
            if (window.confirm(`${from.getFullPath()} to ${to.getFullPath()}`)) {
                NativeFs.fsPromises().rename(from.getFullPath(), to.getFullPath())
                    .then(resolve)
                    .catch((e: any) => reject(FsError.from(e, from)));
            } else {
                resolve();
            }
        });
    }

    public trash(path: ItemPath) {
        if (window.confirm(path.getFullPath())) {
            ipcMessageSender.fs.trash(path.getFullPath());
        }
    }

    public watch(path: ItemPath, callback: () => void) {
        if (NativeFs.watcher !== undefined) {
            NativeFs.watcher.close();
        }

        NativeFs.watcher = NativeFs.fsSync().watch(path.getFullPath(), callback);
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
            path: new ItemPath(undefined, ['usr', 'desktop.ini'], false),
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

    public exists(path: ItemPath): boolean {
        const exists = (path: ItemPath) => FakeFs.getItem(path) !== undefined;
        const fileExists = exists(new ItemPath(path.getDriveLetter(), path.getHierarchy(), false));
        const folderExists = exists(new ItemPath(path.getDriveLetter(), path.getHierarchy(), true));
        return fileExists || folderExists;
    }

    public getStats(path: ItemPath): Promise<ItemStats> {
        return new Promise((resolve, reject) => {
            const target = FakeFs.getItem(path);

            if (target === undefined) {
                reject(new FsError(FsErrorKind.NotExists, path));
                return;
            }

            resolve(target.stats);
        });
    }

    public getChildren(path: ItemPath): Promise<Item[]> {
        return new Promise((resolve, reject) => {
            const target = FakeFs.getItem(path);

            if (target === undefined) {
                reject(new FsError(FsErrorKind.NotExists, path));
                return;
            }

            if (target.kind !== ItemKind.Folder) {
                reject(new FsError(FsErrorKind.NotADirectory, path));
                return;
            }

            const children = (target as FakeFolderItem).children.map((eachChild) => {
                const absPath = path.append(eachChild.id, eachChild.isFolder);
                return new Item(FakeFs.getItem(absPath)!);
            });

            resolve(children);
        });
    }

    public duplicate(path: ItemPath): Promise<void> {
        return new Promise(async (resolve, reject) => {
            if (path.isRoot()) {
                reject(new FsError(FsErrorKind.CannotDuplicateTheRootFolder, path));
                return;
            }

            const isOriginalFolder = path.isFolder();
            const originalStats = await this.getStats(path).catch((e) => {
                reject(e);
                return null;
            });

            if (originalStats === null) {
                return;
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

            const targetPath = Fs.getDuplicatePath(path);
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
                id: targetPath.getIdentifier().toString(),
                isFolder: isOriginalFolder,
            });
            FakeFs.items[targetFullPath] = target;
            this.dispatchWatcher(originalParent);
            resolve();
        });
    }

    public create(path: ItemPath): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.exists(path)) {
                reject(new FsError(FsErrorKind.AlreadyExists));
                return;
            }

            // fix
            resolve();
        });
    }

    public rename(from: ItemPath, to: ItemPath): Promise<void> {
        return new Promise((resolve) => {
            if (from.isFolder()) {
                alert('unimplemented');
                resolve();
                return;
            }

            const parent = from.getParent();
            const children = (FakeFs.items[parent.getFullPath()] as FakeFolderItem).children;
            const id = from.getIdentifier().toString();
            const targetIndex = children.findIndex((v) => v.id === id);

            if (targetIndex === -1) {
                throw new FsError(FsErrorKind.NotExists, from);
            }

            children[targetIndex] = {
                id: to.getIdentifier().toString(),
                isFolder: from.isFolder(),
            };

            const origItem = FakeFs.items[from.getFullPath()];
            delete FakeFs.items[from.getFullPath()];
            origItem.path = to;
            FakeFs.items[to.getFullPath()] = origItem;

            this.dispatchWatcher(parent);
            resolve();
        });
    }

    public trash(path: ItemPath) {
        const children = (FakeFs.items[path.getParent().getFullPath()] as FakeFolderItem).children;
        const id = path.getIdentifier().toString();
        const targetIndex = children.findIndex((v) => v.id === id);

        if (targetIndex === -1) {
            throw new FsError(FsErrorKind.NotExists, path);
        }

        children.splice(targetIndex, 1);
        delete FakeFs.items[path.getFullPath()];
        this.dispatchWatcher(path.getParent());
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
