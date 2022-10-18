import { FileItem, FileItemIdentifier, FileItemStats, FolderItem, FolderItemStats, Item, ItemKind, ItemPath, ItemStats } from "./item";

export enum FsErrorKind {
    NoSuchFileOrDirectory = 'no such file or directory',
    NotADirectory = 'not a directory',
    NotAFile = 'not a file',
    CannotReadItemStats = 'cannot read item stats',
}

export const fsEncoding = 'utf-8';

export interface IFs {
    getStats(path: string): ItemStats | undefined;

    getChildren(path: string): Promise<Item[]>;
}

export default class Fs {
    private static isProdEnv: boolean = process.env.NODE_ENV === 'production';

    private static fs(): IFs {
        return Fs.isProdEnv ? new NativeFs() : new FakeFs();
    }

    public static getStats(path: string): ItemStats | undefined {
        return Fs.fs().getStats(path);
    }

    public static getChildren(path: string): Promise<Item[]> {
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

    public getStats(path: string): ItemStats | undefined {
        let stats: any;

        try {
            stats = NativeFs.fs().statSync(path);
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

    public getChildren(path: string): Promise<Item[]> {
        return new Promise((resolve) => NativeFs.fsPromises().readdir(`${path}/`, {
            encoding: fsEncoding,
        })
            .then((childNames: string[]) => {
                const children: Item[] = [];

                childNames.forEach((eachName) => {
                    const absPath = `${path}${path.length !== 0 ? '/' : ''}${eachName}`;
                    const stats = this.getStats(absPath);

                    if (stats === undefined) {
                        console.error(FsErrorKind.CannotReadItemStats);
                        return;
                    }

                    const childItem = stats.kind === ItemKind.File ? {
                        kind: ItemKind.File,
                        path: new ItemPath([path], FileItemIdentifier.from(eachName), false),
                        stats: stats as FileItemStats,
                    } as FileItem : {
                        kind: ItemKind.Folder,
                        path: new ItemPath([path], eachName, true),
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
    children: string[],
};

export type FakeItem = FakeFileItem | FakeFolderItem;

export class FakeFs implements IFs {
    private static items: {
        [index: string]: FakeItem,
    } = {
        '': {
            kind: ItemKind.Folder,
            path: new ItemPath([], '', true),
            stats: {
                kind: ItemKind.Folder,
                created: new Date(),
                lastAccessed: new Date(),
                lastModified: new Date(),
            },
            children: [
                'C:'
            ],
        },
        'C:': {
            kind: ItemKind.Folder,
            path: new ItemPath([], 'C:', true),
            stats: {
                kind: ItemKind.Folder,
                created: new Date(),
                lastAccessed: new Date(),
                lastModified: new Date(),
            },
            children: [
                'main.ches',
                'main.rs',
                'main.js',
            ],
        },
        'C:/main.ches': {
            kind: ItemKind.File,
            path: new ItemPath(['C:'], new FileItemIdentifier('main', 'ches'), false),
            stats: {
                kind: ItemKind.File,
                size: 1024,
                created: new Date(),
                lastAccessed: new Date(),
                lastModified: new Date(),
            },
        },
        'C:/main.rs': {
            kind: ItemKind.File,
            path: new ItemPath(['C:'], new FileItemIdentifier('main', 'rs'), false),
            stats: {
                kind: ItemKind.File,
                size: 1024,
                created: new Date(),
                lastAccessed: new Date(),
                lastModified: new Date(),
            },
        },
        'C:/main.js': {
            kind: ItemKind.File,
            path: new ItemPath(['C:'], new FileItemIdentifier('main', 'js'), false),
            stats: {
                kind: ItemKind.File,
                size: 1024,
                created: new Date(),
                lastAccessed: new Date(),
                lastModified: new Date(),
            },
        },
    };

    public static getItem(path: string): FakeItem | undefined {
        return FakeFs.items[path];
    }

    public getStats(path: string): ItemStats | undefined {
        const target = FakeFs.getItem(path);

        if (target === undefined) {
            console.error(FsErrorKind.NoSuchFileOrDirectory);
            return;
        }

        return target.stats;
    }

    public getChildren(path: string): Promise<Item[]> {
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

            const children = (target as FakeFolderItem).children.map((eachName) => {
                const absPath = `${path}${path.length !== 0 ? '/' : ''}${eachName}`;
                return new Item(FakeFs.getItem(absPath)!);
            });

            resolve(children);
        });
    }
}
