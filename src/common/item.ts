import Fs from "./fs";
import { ItemPropertyKind } from "./property";

/* Item */

export enum ItemKind {
    File,
    Folder,
}

export class Item {
    private readonly kind: ItemKind;
    private readonly item: FileItem | FolderItem;

    private constructor(
        kind: ItemKind,
        item: FileItem | FolderItem,
    ) {
        this.kind = kind;
        this.item = item;
    }

    public static file(file: FileItem): Item {
        return new Item(ItemKind.File, file);
    }

    public static folder(folder: FolderItem): Item {
        return new Item(ItemKind.Folder, folder);
    }

    public isFile(): boolean {
        return this.kind === ItemKind.File;
    }

    public isFolder(): boolean {
        return this.kind === ItemKind.Folder;
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
            return this.isFile() ? `${(this.item as FileItem).size}b` : '';

            case ItemPropertyKind.LastModified:
            const date = this.item.lastModified;
            return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDay()}`;
        }
    }

    public getFullPath(): string {
        return 'unimplemented';
    }

    public read(): Promise<string> {
        return Fs.readFile(this.getFullPath());
    }
}

export type ByteSize = number;

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

    public toString(): string {
        return `${this.name}.${this.extension}`;
    }
};

export type FileItem = {
    id: FileItemIdentifier;
    size: ByteSize,
    lastModified: Date,
};

/* Folder Item */

export type FolderItemIdentifier = string;

export type FolderItem = {
    id: FolderItemIdentifier,
    lastModified: Date,
};
