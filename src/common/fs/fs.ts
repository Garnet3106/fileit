import { Dirent } from "fs";
import { ipcMessageSender, progressEvents, ProgressHandler } from "../ipc";
import { FileItem, FileItemStats, FolderItem, FolderItemStats, Item, ItemKind, ItemStats } from "./item";
import { FileItemIdentifier, FolderItemIdentifier, ItemPath } from "./path";
import { Buffer } from "buffer";

export enum FsErrorKind {
    NotExists = 'Item not exists.',
    AlreadyExists = 'Item already exists.',
    NotADirectory = 'Item is not a directory.',
    NotAFile = 'Item is not a file.',
    BusyOrLocked = 'Item is busy or locked.',
    CannotProcessTheRootFolder = 'Cannot process the root folder.',
    OperationNotPermitted = 'Operation not permitted.',
    ItemIsNotExtractable = 'Item is not extractable.',
    NoPathProvided = 'No path provided',
}

export namespace FsErrorKind {
    const messagePairs: [string, FsErrorKind][] = [
        ['EBUSY:', FsErrorKind.BusyOrLocked],
        ['EEXIST:', FsErrorKind.AlreadyExists],
        ['EISDIR:', FsErrorKind.NotAFile],
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

export enum CompressionFormat {
    Rar = 'rar',
    SZip = '7z',
    Zip = 'zip',
}

export type FileContent = {
    chunks: Buffer[],
    omitted: boolean,
};

export const fsEncoding = 'utf-8';
export const fsBufferSize = 1024;
export const maximumBufferLength = 64;

export interface IFs {
    exists(path: ItemPath): boolean;

    getStats(path: ItemPath): Promise<ItemStats>;

    getChildren(path: ItemPath): Promise<Item[]>;

    create(path: ItemPath): Promise<void>;

    readFile(path: ItemPath): Promise<FileContent>;

    duplicate(path: ItemPath): Promise<void>;

    rename(from: ItemPath, to: ItemPath): Promise<void>,

    trash(path: ItemPath): void;

    compress(format: CompressionFormat, paths: ItemPath[], onProgress: (progress: number) => void): void;

    extract(path: ItemPath, onProgress?: (progress: number) => void): void;

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

    public static readFile(path: ItemPath): Promise<FileContent> {
        return Fs.fs().readFile(path);
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

    public static compress(format: CompressionFormat, paths: ItemPath[], onProgress: (progress: number) => void) {
        Fs.fs().compress(format, paths, onProgress);
    }

    public static extract(path: ItemPath, onProgress?: (progress: number) => void) {
        Fs.fs().extract(path, onProgress);
    }

    public static differentiatePath(path: ItemPath): ItemPath {
        const id = path.getIdentifier();
        const name = path.isFolder() ? id.toString() : (id as FileItemIdentifier).getName();
        const parent = path.getParent();

        function getPath(count: number = 0): ItemPath {
            const newIdIndex = count === 0 ? '' : '_' + count;
            const newName = name + newIdIndex;
            const newId = path.isFolder() ?
                new FolderItemIdentifier(newName) :
                new FileItemIdentifier(newName, (path.getIdentifier() as FileItemIdentifier).getExtension());
            const tmpPath = parent.append(newId.toString(), path.isFolder());
            const tmpPathExists = Fs.exists(tmpPath);
            return tmpPathExists ? getPath(count + 1) : tmpPath;
        };

        return getPath();
    }

    public static generateCompressionDestinationPath(format: CompressionFormat, src: ItemPath[]): ItemPath | null {
        const firstSrc = src.at(0);

        if (firstSrc === undefined) {
            return null;
        }

        const parent = firstSrc.getParent();

        if (src.length === 1) {
            const id = firstSrc.getIdentifier();
            const name = firstSrc.isFolder() ? id.toString() : (id as FileItemIdentifier).getName();
            return parent.append((new FileItemIdentifier(name, format)).toString(), false);
        }

        return parent.append((new FileItemIdentifier('compress', format)).toString(), false);
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

    public readFile(path: ItemPath): Promise<FileContent> {
        return new Promise((resolve, reject) => {
            if (path.isRoot()) {
                reject(new FsError(FsErrorKind.CannotProcessTheRootFolder, path));
                return;
            }

            if (path.isFolder()) {
                reject(new FsError(FsErrorKind.NotAFile, path));
                return;
            }

            const read = () => {
                let omitted = false;
                const stream = NativeFs.fsSync().createReadStream(path.getFullPath(), {
                    encoding: 'utf8',
                    highWaterMark: fsBufferSize,
                });

                let count = 0;
                let chunks: Buffer[] = [];

                stream.on('data', (newChunk: Buffer) => {
                    chunks.push(newChunk);
                    count += 1;

                    if (count >= maximumBufferLength) {
                        omitted = true;
                        stream.close();
                    }
                });

                stream.on('close', () => resolve({
                    chunks: chunks,
                    omitted: omitted,
                }));

                stream.on('error', (e: any) => reject(FsError.from(e, path)));
            };

            this.getStats(path)
                .then((stats) => {
                    if (stats.kind !== ItemKind.File) {
                        reject(new FsError(FsErrorKind.NotAFile, path));
                        return;
                    }

                    read();
                })
                .catch(reject);
        });
    }

    public duplicate(path: ItemPath): Promise<void> {
        return new Promise(async (resolve, reject) => {
            if (path.isRoot()) {
                reject(new FsError(FsErrorKind.CannotProcessTheRootFolder, path));
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

    public compress(format: CompressionFormat, paths: ItemPath[], onProgress: (progress: number) => void) {
        const tmpDestPath = Fs.generateCompressionDestinationPath(format, paths);

        if (tmpDestPath === null) {
            throw new FsError(FsErrorKind.NoPathProvided);
        }

        const destPath = Fs.differentiatePath(tmpDestPath);

        // rm
        if (!window.confirm(destPath.getFullPath())) {
            return;
        }

        const fullPaths = paths.map((v) => v.getFullPath());
        const id = ipcMessageSender.fs.compress(fullPaths, destPath.getFullPath());
        // fix
        const handler = (new ProgressHandler())
            .then((progress) => {
                if (onProgress !== undefined) {
                    onProgress(progress);
                }
            })
            .catch(console.error);

        progressEvents.compression.addHandler(id, handler);
    }

    public extract(path: ItemPath, onProgress?: (progress: number) => void) {
        if (!path.isExtractable()) {
            throw new FsError(FsErrorKind.ItemIsNotExtractable);
        }

        const parent = path.getParent();
        const name = (path.getIdentifier() as FileItemIdentifier).getName();
        const destPath = Fs.differentiatePath(parent.append(name, true));

        // rm
        if (!window.confirm(path.getFullPath() + '\n' + destPath.getFullPath())) {
            return;
        }

        const id = ipcMessageSender.fs.extract(path.getFullPath(), destPath.getFullPath());
        // fix
        const handler = (new ProgressHandler())
            .then((progress) => {
                if (onProgress !== undefined) {
                    onProgress(progress);
                }
            })
            .catch(console.error);

        progressEvents.extraction.addHandler(id, handler);
    }

    public watch(path: ItemPath, callback: () => void) {
        if (NativeFs.watcher !== undefined) {
            NativeFs.watcher.close();
        }

        NativeFs.watcher = NativeFs.fsSync().watch(path.getFullPath(), callback);
    }
}

export type FakeFileItem = FileItem & {
    content: Buffer,
};

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
            content: Buffer.from('content of desktop.ini'),
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
            content: Buffer.from('content of desktop.ini'),
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
            content: Buffer.from('content of win32.sys'),
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

    public readFile(path: ItemPath): Promise<FileContent> {
        return new Promise((resolve, reject) => {
            if (path.isRoot()) {
                reject(new FsError(FsErrorKind.CannotProcessTheRootFolder, path));
                return;
            }

            if (path.isFolder()) {
                reject(new FsError(FsErrorKind.NotAFile, path));
                return;
            }

            const item = FakeFs.getItem(path);

            if (item === undefined) {
                reject(new FsError(FsErrorKind.NotExists, path));
                return;
            }

            if (item.kind === ItemKind.Folder) {
                reject(new FsError(FsErrorKind.NotAFile, path));
                return;
            }

            resolve({
                chunks: [Buffer.from((item as FakeFileItem).content)],
                omitted: false,
            });
        });
    }

    public duplicate(path: ItemPath): Promise<void> {
        return new Promise(async (resolve, reject) => {
            if (path.isRoot()) {
                reject(new FsError(FsErrorKind.CannotProcessTheRootFolder, path));
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
                // fix
                content: (await this.readFile(path).catch(reject))!.chunks[0],
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

    public compress(format: CompressionFormat, paths: ItemPath[], onProgress?: (progress: number) => void) {
        const tmpDestPath = Fs.generateCompressionDestinationPath(format, paths);

        if (tmpDestPath === null) {
            throw new FsError(FsErrorKind.NoPathProvided);
        }

        const destPath = Fs.differentiatePath(tmpDestPath);
        console.log('Compress to ' + destPath.getFullPath());

        if (onProgress !== undefined) {
            setTimeout(() => {
                onProgress(50);

                setTimeout(() => {
                    onProgress(100);
                }, 1000);
            }, 1000);
        }
        // unimplemented
    }

    public extract(path: ItemPath, onProgress?: (progress: number) => void) {
        if (!path.isExtractable()) {
            throw new FsError(FsErrorKind.ItemIsNotExtractable, path);
        }

        const parent = path.getParent();
        const name = (path.getIdentifier() as FileItemIdentifier).getName();
        const destPath = Fs.differentiatePath(parent.append(name, true));
        console.log('Extract to ' + destPath.getFullPath());

        if (onProgress !== undefined) {
            setTimeout(() => {
                onProgress(50);

                setTimeout(() => {
                    onProgress(100);
                }, 1000);
            }, 1000);
        }
        // unimplemented
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
