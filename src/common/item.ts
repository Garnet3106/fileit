import { ItemPropertyKind } from "./property";

/* Path */

export enum ItemPathErrorKind {
    EmptyFileItemIdentifier = 'cannot set empty string as file item identifier',
    CannotAppendPathToFile = 'cannot append path to file',
    ParentCountIsOutOfBounds = 'parent count is out of bounds',
}

export type DriveLetter = string | undefined;

export class ItemPath {
    private driveLetter: DriveLetter;
    private hierarchy: string[];
    private isFolder: boolean;

    public constructor(
        driveLetter: DriveLetter,
        hierarchy: string[],
        isFolder: boolean,
    ) {
        this.driveLetter = driveLetter;
        this.hierarchy = hierarchy;
        this.isFolder = isFolder;
    }

    public append(
        id: ItemIdentifier,
        isFolder: boolean,
    ): ItemPath {
        if (!this.isFolder) {
            throw ItemPathErrorKind.CannotAppendPathToFile;
        }

        // test: toString()
        const path = this.hierarchy.concat(id.toString());
        return new ItemPath(this.driveLetter, path, isFolder);
    }

    public getDriveLetter(): DriveLetter {
        return this.driveLetter;
    }

    public getHierarchy(): string[] {
        return this.hierarchy;
    }

    // todo: add to tests
    public getParent(count: number = 1): ItemPath | undefined {
        if (!this.isFolder) {
            count += 1;
        }

        if (count < 0 || count > this.hierarchy.length) {
            throw ItemPathErrorKind.ParentCountIsOutOfBounds;
        }

        const newHierarchy = this.hierarchy.concat().splice(0, this.hierarchy.length - count);
        return new ItemPath(this.driveLetter, newHierarchy, true);
    }

    public getFullPath(): string {
        const prefix = this.driveLetter !== undefined ? this.driveLetter + ':' : '';
        const dirSuffix = this.isFolder && this.hierarchy.length !== 0 ? '/' : '';
        return `${prefix}/${this.hierarchy.join('/')}${dirSuffix}`;
    }

    public getIdentifier(): ItemIdentifier | null {
        const id = this.hierarchy.at(this.hierarchy.length - 1);

        if (id === undefined) {
            return null;
        }

        return this.isFolder ? id as FolderItemIdentifier : FileItemIdentifier.from(id);
    }
}

/* Item */

export type ItemIdentifier = FileItemIdentifier | FolderItemIdentifier;

export enum ItemKind {
    File,
    Folder,
}

export class Item {
    private readonly item: FileItem | FolderItem;

    public constructor(item: FileItem | FolderItem) {
        this.item = item;
    }

    public isFile(): boolean {
        return this.item.kind === ItemKind.File;
    }

    public isFolder(): boolean {
        return this.item.kind === ItemKind.Folder;
    }

    public getItem(): FileItem | FolderItem {
        return this.item;
    }

    public getPropertyValue(kind: ItemPropertyKind): string {
        switch (kind) {
            case ItemPropertyKind.Icon:
            return 'unimplemented';

            case ItemPropertyKind.Name:
            const id = this.getIdentifier();
            return id !== null ? id.toString() : '';

            case ItemPropertyKind.Size:
            const size = (this.item as FileItem).stats.size;
            return this.isFile() ? `${size !== undefined ? size : '-'}b` : '';

            case ItemPropertyKind.LastModified:
            const date = this.item.stats.lastModified;
            return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDay()}`;
        }
    }

    public getIdentifier(): ItemIdentifier | null {
        return this.item.path.getIdentifier();
    }

    public getPath(): ItemPath {
        return this.item.path;
    }

    public getDriveLetter(): DriveLetter {
        return this.getPath().getDriveLetter();
    }

    public getHierarchy(): string[] {
        return this.getPath().getHierarchy();
    }

    public getFullPath(): string {
        return this.getPath().getFullPath();
    }
}

export type ByteSize = number;
export type ItemStats = FileItemStats | FolderItemStats;

/* File Item */

export class FileItemIdentifier {
    name: string;
    extension: string;

    public constructor(
        name: string,
        extension: string,
    ) {
        if (name.length === 0 && extension.length === 0) {
            throw ItemPathErrorKind.EmptyFileItemIdentifier;
        }

        this.name = name;
        this.extension = extension;
    }

    public static from(id: string): FileItemIdentifier {
        const tokens = id.split('.');

        // without extension
        if (tokens.length === 1) {
            return new FileItemIdentifier(tokens[0], '');
        }

        const extension = tokens[tokens.length - 1];
        const name = id.substring(0, id.length - extension.length - 1);
        return new FileItemIdentifier(name, extension);
    }

    public toString(): string {
        return `${this.name}.${this.extension}`;
    }
};

export type FileItemStats = {
    kind: ItemKind,
    size?: ByteSize,
    created: Date,
    lastAccessed: Date,
    lastModified: Date,
};

export type FileItem = {
    kind: ItemKind.File,
    path: ItemPath,
    stats: FileItemStats,
};

/* Folder Item */

export type FolderItemIdentifier = string; 

export type FolderItemStats = {
    kind: ItemKind,
    created: Date,
    lastAccessed: Date,
    lastModified: Date,
};

export type FolderItem = {
    kind: ItemKind.Folder,
    path: ItemPath,
    stats: FolderItemStats,
};
