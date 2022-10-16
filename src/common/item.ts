import { ItemPropertyKind } from "./property";

/* Item */

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

    public getIdentifier(): string {
        return this.item.id.toString();
    }

    public getPropertyValue(kind: ItemPropertyKind): string {
        switch (kind) {
            case ItemPropertyKind.Icon:
            return 'unimplemented';

            case ItemPropertyKind.Name:
            return this.getIdentifier();

            case ItemPropertyKind.Size:
            const size = (this.item as FileItem).stats.size;
            return this.isFile() ? `${size !== undefined ? size : '-'}b` : '';

            case ItemPropertyKind.LastModified:
            const date = this.item.stats.lastModified;
            return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDay()}`;
        }
    }

    public getFullPath(): string {
        return 'unimplemented';
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
        this.name = name;
        this.extension = extension;
    }

    public static from(id: string): FileItemIdentifier {
        const tokens = id.split('.');
        const extension = tokens[tokens.length - 1];
        const name = id.substring(0, extension.length - 1);
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
    id: FileItemIdentifier,
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
    id: FolderItemIdentifier,
    stats: FolderItemStats,
    children: string[],
};
