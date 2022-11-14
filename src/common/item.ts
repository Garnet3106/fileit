import { ItemPropertyKind } from "./property";

/* Path */

export enum ItemPathErrorKind {
    EmptyFileItemIdentifier = 'cannot set empty string as file item identifier',
    CannotAppendPathToFile = 'cannot append path to file',
}

export class ItemPath {
    private parents: string[];
    private id: ItemIdentifier;
    private isFolder: boolean;

    public constructor(
        parents: string[],
        id: ItemIdentifier,
        isFolder: boolean,
    ) {
        this.parents = parents.join('/').split(/[\/\\]/g).filter((eachParent) => eachParent.length !== 0);
        this.id = id;
        this.isFolder = isFolder;
    }

    public append(
        id: ItemIdentifier,
        isFolder: boolean,
    ): ItemPath {
        if (!this.isFolder) {
            throw ItemPathErrorKind.CannotAppendPathToFile;
        }

        const parents = this.parents.concat(this.id as FolderItemIdentifier);
        return new ItemPath(parents, id, isFolder);
    }

    public getParents(): string[] {
        return this.parents;
    }

    public getIdentifier(): string {
        return this.id.toString();
    }

    public getFullPath(): string {
        const parentPath = this.parents.map((eachParent) => eachParent + '/').join('');
        const parentsStartWith = this.parents[0];
        const hasDriveLetter =
            (parentsStartWith !== undefined && parentsStartWith.endsWith(':')) ||
            (this.parents.length === 0 && this.getIdentifier().endsWith(':') && this.isFolder);

        const begin = hasDriveLetter || (this.parents.length === 0 && this.getIdentifier().length === 0 && this.isFolder) ? '' : '/';
        const dirSeparator = this.isFolder ? '/' : '';

        return begin + parentPath + this.getIdentifier() + dirSeparator;
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
            return this.getIdentifier();

            case ItemPropertyKind.Size:
            const size = (this.item as FileItem).stats.size;
            return this.isFile() ? `${size !== undefined ? size : '-'}b` : '';

            case ItemPropertyKind.LastModified:
            const date = this.item.stats.lastModified;
            return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDay()}`;
        }
    }

    public getIdentifier(): string {
        return this.item.path.getIdentifier();
    }

    public getPath(): ItemPath {
        return this.item.path;
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
