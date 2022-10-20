import { Dirent } from "fs";
import { FileItem, FileItemIdentifier, FileItemStats, FolderItem, FolderItemStats, Item, ItemKind, ItemPath, ItemStats } from "./item";

export enum FsErrorKind {
    NoSuchFileOrDirectory = 'no such file or directory',
    NotADirectory = 'not a directory',
    NotAFile = 'not a file',
    CannotReadItemStats = 'cannot read item stats',
}

export const fsEncoding = 'utf-8';

export interface IFs {
    getStats(path: ItemPath): ItemStats | undefined;

    getChildren(path: ItemPath): Promise<Item[]>;
}

export default class Fs {
    private static isProdEnv: boolean = process.env.NODE_ENV === 'production';

    private static fs(): IFs {
        return Fs.isProdEnv ? new NativeFs() : new FakeFs();
    }

    public static getStats(path: ItemPath): ItemStats | undefined {
        return Fs.fs().getStats(path);
    }

    public static getChildren(path: ItemPath): Promise<Item[]> {
        return Fs.fs().getChildren(path);
    }
};

export class NativeFs implements IFs {
    private static fs(): any {
        return process.env.NODE_ENV === 'test' ? require('fs') : window.require('fs');
    }

    private static fsPromises(): any {
        return this.fs().promises;
    }

    public getStats(path: ItemPath): ItemStats | undefined {
        let stats: any;

        try {
            stats = NativeFs.fs().statSync(path.getFullPath());
        } catch (e) {
            console.error(e);
            return;
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

                    if (stats === undefined) {
                        console.error(FsErrorKind.CannotReadItemStats);
                        return;
                    }

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
            path: new ItemPath([], '', true),
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
            path: new ItemPath([], new FileItemIdentifier('desktop', 'ini'), false),
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
            path: new ItemPath([], 'usr', true),
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
            path: new ItemPath(['usr'], new FileItemIdentifier('main', 'rs'), false),
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
            path: new ItemPath(['usr'], new FileItemIdentifier('win32', 'sys'), false),
            stats: {
                kind: ItemKind.File,
                size: 1024,
                created: new Date(),
                lastAccessed: new Date(),
                lastModified: new Date(),
            },
        },
    };

    public static getItem(path: ItemPath): FakeItem | undefined {
        return FakeFs.items[path.getFullPath()];
    }

    public getStats(path: ItemPath): ItemStats | undefined {
        const target = FakeFs.getItem(path);

        if (target === undefined) {
            console.error(FsErrorKind.NoSuchFileOrDirectory);
            return;
        }

        return target.stats;
    }

    public getChildren(path: ItemPath): Promise<Item[]> {
        return new Promise((resolve, reject) => {
            const target = FakeFs.getItem(path);

            if (target === undefined) {
                reject(FsErrorKind.NoSuchFileOrDirectory);
                return;
            }

            if (target.kind !== ItemKind.Folder) {
                reject(FsErrorKind.NotADirectory);
                return;
            }

            const children = (target as FakeFolderItem).children.map((eachChild) => {
                const absPath = path.append(eachChild.id, eachChild.isFolder);
                return new Item(FakeFs.getItem(absPath)!);
            });

            resolve(children);
        });
    }
}
