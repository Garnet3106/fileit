import { FileItem, FileItemIdentifier, FileItemStats, FolderItem, FolderItemStats, Item, ItemKind, ItemStats } from "./item";

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
        return window.require('fs');
    }

    private static fsPromises(): any {
        return window.require('fs').promises;
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
        return new Promise((resolve, reject) => NativeFs.fsPromises().readdir(`${path}/`, {
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

                    const childItem = stats.kind === ItemKind.Folder ? {
                        kind: ItemKind.File,
                        id: FileItemIdentifier.from(eachName),
                        stats: stats as FileItemStats,
                    } as FileItem : {
                        kind: ItemKind.Folder,
                        id: eachName,
                        stats: stats as FolderItemStats,
                        children: (() => {
                            try {
                                return NativeFs.fs().readdirSync(absPath, {
                                    encoding: fsEncoding,
                                }) as string[];
                            } catch (e) {
                                console.error(e);
                            }
                        })(),
                    } as FolderItem;

                    children.push(new Item(childItem));
                });

                resolve(children);
            }));
    }
}

export class FakeFs implements IFs {
    private static items: {
        [index: string]: Item,
    } = {
        '': new Item({
            kind: ItemKind.Folder,
            id: '',
            stats: {
                kind: ItemKind.Folder,
                created: new Date(),
                lastAccessed: new Date(),
                lastModified: new Date(),
            },
            children: [
                'C:'
            ],
        }),
        'C:': new Item({
            kind: ItemKind.Folder,
            id: 'C:',
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
        }),
        'C:/main.ches': new Item({
            kind: ItemKind.File,
            id: new FileItemIdentifier('main', 'ches'),
            stats: {
                kind: ItemKind.File,
                size: 1024,
                created: new Date(),
                lastAccessed: new Date(),
                lastModified: new Date(),
            },
        }),
        'C:/main.rs': new Item({
            kind: ItemKind.File,
            id: new FileItemIdentifier('main', 'rs'),
            stats: {
                kind: ItemKind.File,
                size: 1024,
                created: new Date(),
                lastAccessed: new Date(),
                lastModified: new Date(),
            },
        }),
        'C:/main.js': new Item({
            kind: ItemKind.File,
            id: new FileItemIdentifier('main', 'js'),
            stats: {
                kind: ItemKind.File,
                size: 1024,
                created: new Date(),
                lastAccessed: new Date(),
                lastModified: new Date(),
            },
        }),
    };

    public static getItem(path: string): Item | undefined {
        return FakeFs.items[path];
    }

    public getStats(path: string): ItemStats | undefined {
        const target = FakeFs.getItem(path);

        if (target === undefined) {
            console.error(FsErrorKind.NoSuchFileOrDirectory);
            return;
        }

        return target.getItem().stats;
    }

    public getChildren(path: string): Promise<Item[]> {
        return new Promise((resolve, reject) => {
            const target = FakeFs.getItem(path);

            if (target === undefined) {
                reject(FsErrorKind.NoSuchFileOrDirectory);
                return;
            }

            if (!target.isFolder()) {
                reject(FsErrorKind.NotADirectory);
                return;
            }

            const children = (target.getItem() as FolderItem).children.map((eachName) => {
                const absPath = `${path}${path.length !== 0 ? '/' : ''}${eachName}`;
                return FakeFs.getItem(absPath)!;
            });

            resolve(children);
        });
    }
}
