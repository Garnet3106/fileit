import { ItemPropertyKind } from "../property";
import { DriveLetter, ItemIdentifier, ItemPath } from "./path";

export enum ItemKind {
    File,
    Folder,
}

export namespace ItemKind {
    export function from(isFolder: boolean): ItemKind {
        return isFolder ? ItemKind.Folder : ItemKind.File;
    }
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

    public getIdentifier(): ItemIdentifier {
        return this.item.path.getIdentifier();
    }

    public getPath(): ItemPath {
        return this.item.path;
    }

    public isRoot(): boolean {
        return this.getPath().isRoot();
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
