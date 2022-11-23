export type ItemIdentifier = FileItemIdentifier | FolderItemIdentifier;

export class FileItemIdentifier {
    name: string;
    extension: string;

    public constructor(
        name: string,
        extension: string,
    ) {
        if (name.length === 0 && extension.length === 0) {
            throw new ItemPathError(ItemPathErrorKind.EmptyFileIdentifier);
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

export type FolderItemIdentifier = string; 

export enum ItemPathErrorKind {
    EmptyFileIdentifier = 'Empty string specified as file identifier',
    CannotAppendToFilePath = 'Cannot append to file path.',
    HierarchyCountIsOutOfBounds = 'Hierarchy count is out of bounds.',
}

export class ItemPathError extends Error {
    public path?: ItemPath;

    public constructor(kind: ItemPathErrorKind, path?: ItemPath) {
        super();
        this.name = '';
        this.message = kind;
        this.path = path;
    }
}

export type DriveLetter = string | undefined;

export class ItemPath {
    private driveLetter: DriveLetter;
    private hierarchy: string[];
    private _isFolder: boolean;

    public constructor(
        driveLetter: DriveLetter,
        hierarchy: string[],
        isFolder: boolean,
    ) {
        this.driveLetter = driveLetter;
        this.hierarchy = hierarchy;
        this._isFolder = isFolder;
    }

    public isEqual(path: ItemPath): boolean {
        return this.getFullPath() === path.getFullPath();
    }

    public isRoot(): boolean {
        return this.hierarchy.length === 0;
    }

    public isFolder(): boolean {
        return this._isFolder;
    }

    public append(
        id: ItemIdentifier,
        isFolder: boolean,
    ): ItemPath {
        if (!this._isFolder) {
            throw new ItemPathError(ItemPathErrorKind.CannotAppendToFilePath, this);
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
    public getParent(count: number = 1): ItemPath {
        if (count < 0 || count > this.hierarchy.length) {
            throw new ItemPathError(ItemPathErrorKind.HierarchyCountIsOutOfBounds, this);
        }

        const newHierarchy = this.hierarchy.concat().splice(0, this.hierarchy.length - count);
        return new ItemPath(this.driveLetter, newHierarchy, true);
    }

    public getFullPath(): string {
        const prefix = this.driveLetter !== undefined ? this.driveLetter + ':' : '';
        const dirSuffix = this._isFolder && this.hierarchy.length !== 0 ? '/' : '';
        return `${prefix}/${this.hierarchy.join('/')}${dirSuffix}`;
    }

    public getIdentifier(): ItemIdentifier {
        const id = this.hierarchy.at(this.hierarchy.length - 1) ?? '/';
        return this._isFolder ? id as FolderItemIdentifier : FileItemIdentifier.from(id);
    }
}
